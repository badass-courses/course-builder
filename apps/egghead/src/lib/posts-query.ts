'use server'

import { revalidatePath, revalidateTag, unstable_cache } from 'next/cache'
import { redirect } from 'next/navigation'
import { courseBuilderAdapter, db } from '@/db'
import { eggheadPgQuery } from '@/db/eggheadPostgres'
import {
	contentResource,
	contentResourceResource,
	contentResourceTag as contentResourceTagTable,
	users,
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
import { and, asc, desc, eq, like, or, sql } from 'drizzle-orm'
import readingTime from 'reading-time'
import { z } from 'zod'

import 'server-only'

import { EggheadApiError } from '@/errors/egghead-api-error'
import { POST_CREATED_EVENT } from '@/inngest/events/post-created'
import { inngest } from '@/inngest/inngest.server'

import { getMuxAsset } from '@coursebuilder/core/lib/mux'
import {
	ContentResource,
	ContentResourceSchema,
} from '@coursebuilder/core/schemas'
import { last } from '@coursebuilder/nodash'

import {
	clearPublishedAt,
	determineEggheadAccess,
	determineEggheadLessonState,
	determineEggheadVisibilityState,
	EGGHEAD_API_V1_BASE_URL,
	getEggheadToken,
	getEggheadUserProfile,
	setPublishedAt,
	updateEggheadLesson,
	writeLegacyTaggingsToEgghead,
} from './egghead'
import { writeNewPostToDatabase } from './posts-new-query'
import { createNewPostVersion } from './posts-version-query'
import {
	replaceSanityLessonResources,
	updateSanityLesson,
} from './sanity-content-query'
import { EggheadTag, EggheadTagSchema } from './tags'
import { upsertPostToTypeSense } from './typesense-query'

export async function searchLessons(searchTerm: string) {
	const { session } = await getServerAuthSession()
	const userId = session?.user?.id

	const lessons = await db.query.contentResource.findMany({
		where: and(
			eq(contentResource.type, 'post'),
			sql`JSON_EXTRACT(${contentResource.fields}, '$.postType') = 'lesson'`,
			or(
				sql`LOWER(JSON_EXTRACT(${contentResource.fields}, '$.title')) LIKE ${`%${searchTerm.toLowerCase()}%`}`,
				sql`LOWER(JSON_EXTRACT(${contentResource.fields}, '$.body')) LIKE ${`%${searchTerm.toLowerCase()}%`}`,
			),
		),
		orderBy: [
			// Sort by createdById matching current user (if logged in)
			sql`CASE
				WHEN ${contentResource.createdById} = ${userId} THEN 0
				ELSE 1
			END`,
			// Secondary sort by title match (prioritize title matches)
			sql`CASE
				WHEN LOWER(JSON_EXTRACT(${contentResource.fields}, '$.title')) LIKE ${`%${searchTerm.toLowerCase()}%`} THEN 0
				ELSE 1
			END`,
			// Then sort by title alphabetically
			sql`JSON_EXTRACT(${contentResource.fields}, '$.title')`,
		],
	})

	return ContentResourceSchema.array().parse(lessons)
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

export const getCachedPost = unstable_cache(
	async (slug: string) => getPost(slug),
	['posts'],
	{ revalidate: 3600, tags: ['posts'] },
)

export async function getPost(slug: string): Promise<Post | null> {
	const postData = await db.query.contentResource.findFirst({
		where: or(
			eq(sql`JSON_EXTRACT (${contentResource.fields}, "$.slug")`, slug),
			eq(contentResource.id, slug),
		),
		with: {
			tags: {
				with: {
					tag: true,
				},
				orderBy: asc(contentResourceTagTable.position),
			},
			resources: {
				with: {
					resource: true,
				},
				orderBy: asc(contentResourceResource.position),
			},
		},
	})

	const parsedPost = PostSchema.safeParse(postData)
	if (!parsedPost.success) {
		console.error(
			'Error parsing post',
			parsedPost.error,
			JSON.stringify(postData),
		)
		return null
	}

	const post = parsedPost.data

	if (!post.currentVersionId) {
		await createNewPostVersion(post)
	}

	return post
}

export const getCachedAllPosts = unstable_cache(
	async () => getAllPosts(),
	['posts'],
	{ revalidate: 3600, tags: ['posts'] },
)

export async function getAllPosts(): Promise<Post[]> {
	const posts = await db.query.contentResource.findMany({
		where: eq(contentResource.type, 'post'),
		with: {
			tags: {
				with: {
					tag: true,
				},
				orderBy: asc(contentResourceTagTable.position),
			},
			resources: {
				with: {
					resource: true,
				},
				orderBy: asc(contentResourceResource.position),
			},
		},
		orderBy: desc(contentResource.createdAt),
	})

	const postsParsed = z.array(PostSchema).safeParse(posts)
	if (!postsParsed.success) {
		console.error('Error parsing posts', postsParsed.error)
		return []
	}

	return postsParsed.data
}

export const getCachedAllPostsForUser = unstable_cache(
	async (userId?: string) => getAllPostsForUser(userId),
	['posts'],
	{ revalidate: 3600, tags: ['posts'] },
)

export async function getAllPostsForUser(userId?: string): Promise<Post[]> {
	if (!userId) {
		redirect('/')
	}

	const posts = await db.query.contentResource.findMany({
		where: and(
			eq(contentResource.type, 'post'),
			eq(contentResource.createdById, userId),
		),
		with: {
			tags: {
				with: {
					tag: true,
				},
				orderBy: asc(contentResourceTagTable.position),
			},
			resources: {
				with: {
					resource: true,
				},
				orderBy: asc(contentResourceResource.position),
			},
		},
		orderBy: desc(contentResource.createdAt),
	})

	const postsParsed = z.array(PostSchema).safeParse(posts)
	if (!postsParsed.success) {
		console.error('Error parsing posts', postsParsed.error)
		return []
	}

	return postsParsed.data
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

export async function getPostTags(postId: string): Promise<EggheadTag[]> {
	const tags = await db.query.contentResourceTag.findMany({
		where: eq(contentResourceTagTable.contentResourceId, postId),
		with: {
			tag: true,
		},
	})

	return z.array(EggheadTagSchema).parse(tags.map((tag) => tag.tag))
}

export async function addTagToPost(postId: string, tagId: string) {
	await db.insert(contentResourceTagTable).values({
		contentResourceId: postId,
		tagId,
	})
	await writeLegacyTaggingsToEgghead(postId)

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
			await setPublishedAt(
				currentPost.fields.eggheadLessonId,
				new Date().toISOString(),
			)
		}

		if (action === 'unpublish') {
			await clearPublishedAt(currentPost.fields.eggheadLessonId)
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

	// sync with egghead
	try {
		await removeEggheadLessonFromPlaylist({
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

	//! TODO sync with sanity
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

	revalidateTag('posts')

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

type positionInputIten = {
	currentParentResourceId: string
	parentResourceId: string
	resourceId: string
	position: number
	children?: positionInputIten[]
}

export const updateResourcePositions = async (input: positionInputIten[]) => {
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

	return result
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

export async function getAllPostIds() {
	return await db.query.contentResource
		.findMany({
			where: and(
				eq(contentResource.type, 'post'),
				sql`JSON_EXTRACT(${contentResource.fields}, '$.postType') = 'lesson'`,
			),
			columns: {
				id: true,
			},
		})
		.then((posts) => posts.map((post) => post.id))
}
