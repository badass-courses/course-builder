'use server'

import { revalidatePath, revalidateTag } from 'next/cache'
import { courseBuilderAdapter, db } from '@/db'
import { eggheadPgQuery } from '@/db/eggheadPostgres'
import {
	contentResource,
	contentResourceResource,
	contentResourceTag as contentResourceTagTable,
} from '@/db/schema'
import {
	generateContentHash,
	NewPost,
	Post,
	PostAction,
	PostSchema,
	PostUpdate,
	updatePostSlug,
} from '@/lib/posts'
import { getServerAuthSession } from '@/server/auth'
import { guid } from '@/utils/guid'
import { subject } from '@casl/ability'
import slugify from '@sindresorhus/slugify'
import { and, eq, like } from 'drizzle-orm'
import readingTime from 'reading-time'
import { z } from 'zod'

import 'server-only'

import { EggheadApiError } from '@/errors/egghead-api-error'
import { POST_CREATED_EVENT } from '@/inngest/events/post-created'
import { inngest } from '@/inngest/inngest.server'

import { getMuxAsset } from '@coursebuilder/core/lib/mux'
import { ContentResource } from '@coursebuilder/core/schemas'
import { last } from '@coursebuilder/nodash'

import {
	clearLessonPublishedAt,
	clearPlaylistPublishedAt,
	determineEggheadAccess,
	determineEggheadLessonState,
	determineEggheadVisibilityState,
	EGGHEAD_API_V1_BASE_URL,
	getEggheadToken,
	getEggheadUserProfile,
	setLessonPublishedAt,
	setPlaylistPublishedAt,
	syncEggheadResourceInstructor,
	updateEggheadLesson,
	updateEggheadPlaylist,
	writeLegacyTaggingsToEgghead,
} from './egghead'
import { upsertPostToTypeSense } from './external/typesense'
import { writeNewPostToDatabase } from './posts-new-query'
import { createNewPostVersion } from './posts-version-query'
// Import the read operations from the new module
import {
	getAllPostIds,
	getAllPosts,
	getAllPostsForUser,
	getCachedAllPosts,
	getCachedAllPostsForUser,
	getCachedPost,
	getCoursesForPost,
	getPost,
	getPostTags,
	searchLessons,
} from './posts/read'
// Import the write operations from the new module
import {
	addTagToPost,
	createPost,
	deletePost,
	deletePostFromDatabase,
	getVideoDuration,
	removeTagFromPost,
	setPrimaryTagToPost,
	updatePost,
	updatePostInstructor,
	updatePostTags,
	writePostUpdateToDatabase,
} from './posts/write'
import {
	removeLessonFromSanityCourse,
	reorderResourcesInSanityCourse,
	replaceSanityLessonResources,
	syncSanityResourceInstructor,
	updateSanityCourseMetadata,
	updateSanityLesson,
	writeTagsToSanityResource,
} from './sanity-content-query'
import { EggheadTag } from './tags'

// Re-export them to maintain backwards compatibility
export {
	// Read operations
	searchLessons,
	getPost,
	getCachedPost,
	getAllPosts,
	getCachedAllPosts,
	getAllPostsForUser,
	getCachedAllPostsForUser,
	getPostTags,
	getCoursesForPost,
	getAllPostIds,

	// Write operations
	createPost,
	updatePost,
	deletePost,
	addTagToPost,
	setPrimaryTagToPost,
	updatePostTags,
	removeTagFromPost,
	updatePostInstructor,
	writePostUpdateToDatabase,
	deletePostFromDatabase,
	getVideoDuration,
}

export async function addEggheadLessonToPlaylist({
	eggheadPlaylistId,
	eggheadLessonId,
	position,
}: {
	eggheadPlaylistId: string
	eggheadLessonId: string
	position?: string
}) {
	try {
		const { session, ability } = await getServerAuthSession()

		if (!session?.user?.id || !ability.can('create', 'Content')) {
			throw new Error('Unauthorized')
		}

		const eggheadToken = await getEggheadToken(session.user.id)

		const response = await fetch(
			`${EGGHEAD_API_V1_BASE_URL}/playlists/${eggheadPlaylistId}/items/add`,
			{
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${eggheadToken}`,
					'User-Agent': 'authjs',
				},
				body: JSON.stringify({
					tracklistable: {
						tracklistable_type: 'Lesson',
						tracklistable_id: eggheadLessonId,
						row_order_position: position || 'last',
					},
				}),
			},
		).then(async (res) => {
			if (!res.ok) {
				throw new EggheadApiError(res.statusText, res.status)
			}
			return await res.json()
		})

		return response
	} catch (error) {
		if (error instanceof Error && 'status' in error) {
			if (error.status === 304) {
				// Item already exists in playlist
				console.log('Lesson already exists in playlist')
			} else if (error.status === 403) {
				// Not authorized
				console.log('Not authorized to modify this playlist')
			}
		}
		throw error
	}
}

export async function removePostFromCoursePost({
	postId,
	resourceOfId,
}: {
	postId: string
	resourceOfId: string
}) {
	const { session, ability } = await getServerAuthSession()

	if (!session?.user?.id || !ability.can('create', 'Content')) {
		throw new Error('Unauthorized')
	}

	await db
		.delete(contentResourceResource)
		.where(
			and(
				eq(contentResourceResource.resourceOfId, resourceOfId),
				eq(contentResourceResource.resourceId, postId),
			),
		)

	const post = await getPost(postId)
	const resourceOf = await getPost(resourceOfId)

	if (
		!post ||
		!post.fields?.eggheadLessonId ||
		!resourceOf?.fields?.eggheadPlaylistId
	) {
		throw new Error('eggheadLessonId is required')
	}

	// sync with egghead and sanity
	try {
		await removeEggheadLessonFromPlaylist({
			eggheadLessonId: post.fields.eggheadLessonId,
			eggheadPlaylistId: resourceOf.fields.eggheadPlaylistId,
		})

		await removeLessonFromSanityCourse({
			eggheadLessonId: post.fields.eggheadLessonId,
			eggheadPlaylistId: resourceOf.fields.eggheadPlaylistId,
		})
	} catch (error) {
		// rollback the database if egghead sync fails to stay in sync
		await addResourceToResource({
			resource: post,
			parentResourceId: resourceOfId,
		})

		throw new Error('Error removing lesson from playlist')
	}
}

export async function removeEggheadLessonFromPlaylist({
	eggheadLessonId,
	eggheadPlaylistId,
}: {
	eggheadLessonId: number
	eggheadPlaylistId: number
}) {
	const { session, ability } = await getServerAuthSession()

	if (!session?.user?.id || !ability.can('create', 'Content')) {
		throw new Error('Unauthorized')
	}

	const eggheadToken = await getEggheadToken(session.user.id)

	try {
		const response = await fetch(
			`${EGGHEAD_API_V1_BASE_URL}/playlists/${eggheadPlaylistId}/items/remove`,
			{
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${eggheadToken}`,
					'User-Agent': 'authjs',
				},
				body: JSON.stringify({
					tracklistable: {
						tracklistable_type: 'Lesson',
						tracklistable_id: eggheadLessonId,
					},
				}),
			},
		).then(async (res) => {
			if (!res.ok) {
				console.log('Error removing lesson from playlist', res)
				throw new EggheadApiError(res.statusText, res.status)
			}
			return await res.json()
		})

		return response
	} catch (error) {
		throw error
	}
}

export const addResourceToResource = async ({
	resource,
	parentResourceId,
}: {
	resource: ContentResource
	parentResourceId: string
}) => {
	const parentResource = await db.query.contentResource.findFirst({
		where: like(contentResource.id, `%${last(parentResourceId.split('-'))}%`),
		with: {
			resources: true,
		},
	})

	if (!parentResource) {
		throw new Error(`Workshop with id ${parentResourceId} not found`)
	}

	await db.insert(contentResourceResource).values({
		resourceOfId: parentResource.id,
		resourceId: resource.id,
		position: parentResource.resources.length,
	})

	const resourceResource = db.query.contentResourceResource.findFirst({
		where: and(
			eq(contentResourceResource.resourceOfId, parentResource.id),
			eq(contentResourceResource.resourceId, resource.id),
		),
		with: {
			resource: true,
		},
	})

	return resourceResource
}

export const updateResourcePosition = async ({
	currentParentResourceId,
	parentResourceId,
	resourceId,
	position,
}: {
	currentParentResourceId: string
	parentResourceId: string
	resourceId: string
	position: number
}) => {
	const result = await db
		.update(contentResourceResource)
		.set({ position, resourceOfId: parentResourceId })
		.where(
			and(
				eq(contentResourceResource.resourceOfId, currentParentResourceId),
				eq(contentResourceResource.resourceId, resourceId),
			),
		)

	revalidateTag('posts')

	return result
}

export type positionInputItem = {
	currentParentResourceId: string
	parentResourceId: string
	resourceId: string
	position: number
	children?: positionInputItem[]
}

async function reorderEggheadPlaylistItems(
	input: { resourceId: string; position: number }[],
	currentParentResourceId: string,
) {
	const currentParentResourcePost = await getPost(currentParentResourceId)
	const eggheadPlaylistId = currentParentResourcePost?.fields?.eggheadPlaylistId

	if (!eggheadPlaylistId) {
		return null
	}

	const tracklistAttributes = await Promise.all(
		input.map(async (item) => {
			const resource = await db.query.contentResource.findFirst({
				where: eq(contentResource.id, item.resourceId),
			})
			return {
				tracklistable_type: resource?.fields?.postType,
				tracklistable_id: resource?.fields?.eggheadLessonId,
				row_order_position: item.position,
			}
		}),
	)

	// Update each tracklist item's position in the playlist
	await Promise.all(
		tracklistAttributes.map((item) =>
			eggheadPgQuery(
				`UPDATE tracklists SET row_order = ${item.row_order_position} 
				WHERE tracklistable_id = ${item.tracklistable_id}
				AND playlist_id = ${eggheadPlaylistId}`,
			),
		),
	)

	return true
}

export const updateResourcePositions = async (input: positionInputItem[]) => {
	const { session, ability } = await getServerAuthSession()

	if (!session?.user?.id || !ability.can('create', 'Content')) {
		throw new Error('Unauthorized')
	}

	const result = await db.transaction(async (trx) => {
		for (const {
			currentParentResourceId,
			parentResourceId,
			resourceId,
			position,
			children,
		} of input) {
			await trx
				.update(contentResourceResource)
				.set({ position, resourceOfId: parentResourceId })
				.where(
					and(
						eq(contentResourceResource.resourceOfId, currentParentResourceId),
						eq(contentResourceResource.resourceId, resourceId),
					),
				)
			for (const child of children || []) {
				await trx
					.update(contentResourceResource)
					.set({
						position: child.position,
						resourceOfId: child.parentResourceId,
					})
					.where(
						and(
							eq(
								contentResourceResource.resourceOfId,
								child.currentParentResourceId,
							),
							eq(contentResourceResource.resourceId, child.resourceId),
						),
					)
			}
		}
	})

	await reorderResourcesInSanityCourse({
		resources: input,
		parentResourceId: input?.[0]?.currentParentResourceId ?? '',
	})

	const response = await reorderEggheadPlaylistItems(
		input,
		input?.[0]?.currentParentResourceId ?? '',
	)

	return response
}

export async function removeSection(
	sectionId: string,
	pathToRevalidate: string,
) {
	await db.delete(contentResource).where(eq(contentResource.id, sectionId))

	revalidatePath(pathToRevalidate)
	return await db
		.delete(contentResourceResource)
		.where(eq(contentResourceResource.resourceId, sectionId))
}
