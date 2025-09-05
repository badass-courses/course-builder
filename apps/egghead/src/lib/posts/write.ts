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
import { and, eq } from 'drizzle-orm'
import readingTime from 'reading-time'
import { z } from 'zod'

import 'server-only'

import { EggheadApiError } from '@/errors/egghead-api-error'
import { POST_CREATED_EVENT } from '@/inngest/events/post-created'
import { inngest } from '@/inngest/inngest.server'
import { getOGImageUrlForResourceAPI } from '@/utils/get-og-image-url-for-resource'

import { getMuxAsset } from '@coursebuilder/core/lib/mux'
import { ContentResource } from '@coursebuilder/core/schemas'

import {
	clearLessonPublishedAt,
	clearPlaylistPublishedAt,
	createEggheadLessonVersion,
	determineEggheadAccess,
	determineEggheadLessonState,
	determineEggheadVisibilityState,
	getEggheadUserProfile,
	setLessonPublishedAt,
	setPlaylistPublishedAt,
	syncEggheadResourceInstructor,
	updateEggheadLesson,
	updateEggheadPlaylist,
	writeLegacyTaggingsToEgghead,
} from '../egghead'
import { writeNewPostToDatabase } from '../posts-new-query'
import { createNewPostVersion } from '../posts-version-query'
import {
	removeLessonFromSanityCourse,
	replaceSanityLessonResources,
	syncSanityResourceInstructor,
	updateSanityCourseMetadata,
	updateSanityLesson,
	writeTagsToSanityResource,
} from '../sanity-content-query'
import { EggheadTag } from '../tags'
import { upsertPostToTypeSense } from '../typesense/post'
import { getPost } from './read'

/**
 * Deletes a post by its ID
 * Performs authorization check and handles revalidation of cache/paths
 */
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

/**
 * Creates a new post based on the provided input
 * Performs authorization check and sends event notification
 */
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

/**
 * Updates a post based on the provided input and action
 * Performs authorization check and handles revalidation
 */
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

/**
 * Adds a tag to a post
 * Updates both egghead and sanity representations
 */
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

	// Revalidate cache for events
	if (post?.type === 'event') {
		revalidateTag('events')
	}
}

/**
 * Sets the primary tag for a post
 */
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

/**
 * Updates all tags for a post in a transaction
 */
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

/**
 * Removes a tag from a post
 * Updates both egghead and sanity representations
 */
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

	// Revalidate cache for events
	if (post?.type === 'event') {
		revalidateTag('events')
	}
}

/**
 * Updates the instructor for a post
 * Manages authorization and syncs with egghead and sanity
 */
export async function updatePostInstructor(postId: string, userId: string) {
	const { ability, session } = await getServerAuthSession()

	if (!session?.user?.id || ability.cannot('manage', 'all')) {
		throw new Error('Unauthorized')
	}

	const originalPost = await getPost(postId)

	await db
		.update(contentResource)
		.set({
			createdById: userId,
		})
		.where(eq(contentResource.id, postId))

	try {
		await syncEggheadResourceInstructor(postId, userId)
		await syncSanityResourceInstructor(postId, userId)
	} catch (error) {
		console.error(
			`Error syncing egghead resource instructor with id ${userId} for post ${postId}, rolling db back to id ${originalPost?.createdById}`,
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

/**
 * Writes post updates to the database and syncs with external systems
 */
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

	const lessonState = await determineEggheadLessonState(
		action,
		postUpdate.fields.state,
	)

	const lessonVisibilityState = await determineEggheadVisibilityState(
		postUpdate.fields.visibility,
		postUpdate.fields.state,
	)

	const isPublished = postUpdate.fields.state === 'published'

	const access = await determineEggheadAccess(postUpdate?.fields?.access)

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
			published: isPublished,
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

	if (currentPost.fields.eggheadLessonId) {
		await replaceSanityLessonResources({
			post: updatedPost,
			eggheadLessonId: currentPost.fields.eggheadLessonId,
			videoResourceId: videoResourceId,
		})
	}

	const newContentHash = generateContentHash(updatedPost)

	const currentContentHash = currentPost.currentVersionId?.split('~')[1]

	if (newContentHash !== currentContentHash) {
		await createNewPostVersion(updatedPost, updatedById)
		if (updatedPost.fields.eggheadLessonId) {
			await createEggheadLessonVersion(
				updatedPost.fields.eggheadLessonId,
				'Post metadata updated',
			)
		}
	}

	try {
		await upsertPostToTypeSense(updatedPost, action)
	} catch (error) {
		console.error('Error in upsertPostToTypeSense', error)
	}

	return updatedPost
}

/**
 * Permanently deletes a post from the database
 * Changes egghead lesson state to 'retired'
 */
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

/**
 * Gets the duration of a video for a post
 */
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
