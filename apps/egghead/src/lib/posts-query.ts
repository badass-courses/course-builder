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
}

export async function deletePost(id: string) {
	console.log('deleting post', id)
	const { session, ability } = await getServerAuthSession()
	const user = session?.user
	const postData = await getPost(id)

	const post = PostSchema.nullish().parse(postData)

	if (!post) {
		throw new Error(`Post with id ${id} not found.`)
	}

	if (!user || !ability.can('delete', subject('Content', post))) {
		throw new Error('Unauthorized')
	}

	await deletePostFromDatabase(id)

	revalidateTag('posts')
	revalidateTag(id)
	revalidatePath('/posts')

	return true
}

// rpc style "action" verb-y
export async function createPost(input: NewPost) {
	const { session, ability } = await getServerAuthSession()

	if (!session?.user?.id || !ability.can('create', 'Content')) {
		throw new Error('Unauthorized')
	}

	const profile = await getEggheadUserProfile(session.user.id)

	if (!profile?.instructor?.id) {
		throw new Error('No egghead instructor id found for user')
	}

	const post = await writeNewPostToDatabase({
		title: input.title,
		videoResourceId: input.videoResourceId || undefined,
		postType: input.postType,
		eggheadInstructorId: profile.instructor.id,
		eggheadUserId: profile.id,
		createdById: session.user.id,
	})

	if (post) {
		await inngest.send({
			name: POST_CREATED_EVENT,
			data: {
				post: post,
			},
		})

		revalidateTag('posts')

		return post
	} else {
		throw new Error('🚨 Error creating post: Post not found')
	}
}

export async function updatePost(
	input: PostUpdate,
	action: PostAction = 'save',
) {
	const { session, ability } = await getServerAuthSession()
	const user = session?.user

	console.log('updatePost', input)

	const currentPost = await getPost(input.id)

	if (!currentPost) {
		throw new Error(`Post with id ${input.id} not found.`)
	}

	if (!user || !ability.can(action, subject('Content', currentPost))) {
		throw new Error('Unauthorized')
	}

	revalidateTag('posts')

	return writePostUpdateToDatabase({
		currentPost,
		postUpdate: input,
		action,
		updatedById: user.id,
	})
}

export async function addTagToPost(postId: string, tagId: string) {
	await db.insert(contentResourceTagTable).values({
		contentResourceId: postId,
		tagId,
	})
	await writeLegacyTaggingsToEgghead(postId)
	await writeTagsToSanityResource(postId)

	const post = await db.query.contentResource.findFirst({
		where: eq(contentResource.id, postId),
		with: {
			tags: true,
		},
	})

	if (post?.tags.length === 1) {
		await db
			.update(contentResource)
			.set({
				fields: {
					...post.fields,
					primaryTagId: tagId,
				},
			})
			.where(eq(contentResource.id, postId))
	}
}

export async function setPrimaryTagToPost(postId: string, tagId: string) {
	const post = await db.query.contentResource.findFirst({
		where: eq(contentResource.id, postId),
	})

	if (!post) {
		throw new Error(`Post with id ${postId} not found.`)
	}

	await db
		.update(contentResource)
		.set({
			fields: {
				...post.fields,
				primaryTagId: tagId,
			},
		})
		.where(eq(contentResource.id, postId))
}

export async function updatePostTags(postId: string, tags: EggheadTag[]) {
	await db
		.transaction(async (trx) => {
			await trx
				.delete(contentResourceTagTable)
				.where(eq(contentResourceTagTable.contentResourceId, postId))

			await trx.insert(contentResourceTagTable).values(
				tags.map((tag) => ({
					contentResourceId: postId,
					tagId: tag.id,
				})),
			)
		})
		.then(() => writeLegacyTaggingsToEgghead(postId))
}

export async function removeTagFromPost(postId: string, tagId: string) {
	const post = await db.query.contentResource.findFirst({
		where: eq(contentResource.id, postId),
	})

	await db
		.delete(contentResourceTagTable)
		.where(
			and(
				eq(contentResourceTagTable.contentResourceId, postId),
				eq(contentResourceTagTable.tagId, tagId),
			),
		)
	await writeLegacyTaggingsToEgghead(postId)
	await writeTagsToSanityResource(postId)

	if (post?.fields?.primaryTagId === tagId) {
		await db
			.update(contentResource)
			.set({
				fields: {
					...post.fields,
					primaryTagId: null,
				},
			})
			.where(eq(contentResource.id, postId))
	}
}

export async function updatePostInstructor(
	postId: string,
	instructorId: string,
) {
	const { ability, session } = await getServerAuthSession()

	if (!session?.user?.id || ability.cannot('manage', 'all')) {
		throw new Error('Unauthorized')
	}

	const originalPost = await getPost(postId)

	await db
		.update(contentResource)
		.set({
			createdById: instructorId,
		})
		.where(eq(contentResource.id, postId))

	try {
		await syncEggheadResourceInstructor(postId, instructorId)
		await syncSanityResourceInstructor(postId, instructorId)
	} catch (error) {
		console.error(
			`Error syncing egghead resource instructor with id ${instructorId} for post ${postId}, rolling db back to id ${originalPost?.createdById}`,
			error,
		)

		await db
			.update(contentResource)
			.set({
				createdById: originalPost?.createdById,
			})
			.where(eq(contentResource.id, postId))
	}
}

export async function writePostUpdateToDatabase(input: {
	currentPost?: Post
	postUpdate: PostUpdate
	action: PostAction
	updatedById: string
}) {
	const {
		currentPost = await getPost(input.postUpdate.id),
		postUpdate,
		action = 'save',
		updatedById,
	} = input

	if (!currentPost) {
		throw new Error(`Post with id ${input.postUpdate.id} not found.`)
	}

	if (!postUpdate.fields.title) {
		throw new Error('Title is required')
	}

	let postSlug = updatePostSlug(currentPost, postUpdate.fields.title)

	const postGuid = currentPost?.fields.slug.split('~')[1] || guid()

	if (postUpdate.fields.title !== currentPost.fields.title) {
		postSlug = `${slugify(postUpdate.fields.title ?? '')}~${postGuid}`
	}

	const lessonState = determineEggheadLessonState(
		action,
		postUpdate.fields.state,
	)

	const lessonVisibilityState = determineEggheadVisibilityState(
		postUpdate.fields.visibility,
		postUpdate.fields.state,
	)

	const access = determineEggheadAccess(postUpdate?.fields?.access)

	const duration = await getVideoDuration(currentPost.resources)
	const timeToRead = Math.floor(
		readingTime(currentPost.fields.body ?? '').time / 1000,
	)

	const videoResourceId =
		postUpdate.videoResourceId ??
		currentPost.resources?.find(
			(resource) => resource.resource.type === 'videoResource',
		)?.resourceId

	const videoResource = videoResourceId
		? await courseBuilderAdapter.getVideoResource(videoResourceId)
		: null

	if (currentPost.fields.eggheadLessonId) {
		await updateEggheadLesson({
			title: postUpdate.fields.title,
			slug: postSlug, // probably bypassing friendly id here, does it matter?
			guid: postGuid,
			body: postUpdate.fields.body ?? '',
			eggheadLessonId: currentPost.fields.eggheadLessonId,
			state: lessonState,
			visibilityState: lessonVisibilityState,
			access,
			duration: duration > 0 ? duration : timeToRead,
			...(videoResource?.muxPlaybackId && {
				hlsUrl: `https://stream.mux.com/${videoResource.muxPlaybackId}.m3u8`,
			}),
		})

		if (action === 'publish') {
			await setLessonPublishedAt(
				currentPost.fields.eggheadLessonId,
				new Date().toISOString(),
			)
		}

		if (action === 'unpublish') {
			await clearLessonPublishedAt(currentPost.fields.eggheadLessonId)
		}
	} else if (currentPost.fields.eggheadPlaylistId) {
		await updateEggheadPlaylist({
			title: postUpdate.fields.title,
			slug: postSlug,
			guid: postGuid,
			body: postUpdate.fields.body ?? '',
			eggheadPlaylistId: currentPost.fields.eggheadPlaylistId,
			state: lessonState,
			visibilityState: lessonVisibilityState,
			accessState: access ? 'pro' : 'free',
		})

		await updateSanityCourseMetadata({
			eggheadPlaylistId: currentPost.fields.eggheadPlaylistId,
			title: postUpdate.fields.title,
			slug: postSlug,
			sharedId: postGuid,
			description: postUpdate.fields.body ?? '',
			productionProcessState: postUpdate.fields.state,
			accessLevel: postUpdate.fields.access,
			searchIndexingState: postUpdate.fields.visibility,
			image: postUpdate.fields.image || '',
		})

		if (action === 'publish') {
			await setPlaylistPublishedAt(
				currentPost.fields.eggheadPlaylistId,
				new Date().toISOString(),
			)
		}

		if (action === 'unpublish') {
			await clearPlaylistPublishedAt(currentPost.fields.eggheadPlaylistId)
		}
	}

	await courseBuilderAdapter.updateContentResourceFields({
		id: currentPost.id,
		fields: {
			...currentPost.fields,
			...postUpdate.fields,
			slug: postSlug,
		},
	})

	const updatedPost = await getPost(currentPost.id)

	if (!updatedPost) {
		throw new Error(`Post with id ${currentPost.id} not found.`)
	}

	await updateSanityLesson(currentPost.fields.eggheadLessonId, updatedPost)
	await replaceSanityLessonResources({
		post: updatedPost,
		eggheadLessonId: currentPost.fields.eggheadLessonId,
		videoResourceId: videoResourceId,
	})

	const newContentHash = generateContentHash(updatedPost)

	const currentContentHash = currentPost.currentVersionId?.split('~')[1]

	if (newContentHash !== currentContentHash) {
		await createNewPostVersion(updatedPost, updatedById)
	}

	await upsertPostToTypeSense(updatedPost, action)

	return updatedPost
}

export async function deletePostFromDatabase(id: string) {
	const post = PostSchema.nullish().parse(await getPost(id))

	if (!post) {
		throw new Error(`Post with id ${id} not found.`)
	}

	if (post.fields.eggheadLessonId) {
		await eggheadPgQuery(
			`UPDATE lessons SET state = 'retired' WHERE id = ${post.fields.eggheadLessonId}`,
		)
	}

	await db
		.delete(contentResourceResource)
		.where(eq(contentResourceResource.resourceOfId, id))

	await db.delete(contentResource).where(eq(contentResource.id, id))

	return true
}

export async function getVideoDuration(
	resources: Post['resources'],
): Promise<number> {
	const videoResource = resources?.find(
		(resource) => resource.resource.type === 'videoResource',
	)
	if (videoResource) {
		const muxAsset = await getMuxAsset(videoResource.resource.fields.muxAssetId)
		return muxAsset?.duration ? Math.floor(muxAsset.duration) : 0
	}
	return 0
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
