'use server'

import { revalidatePath, revalidateTag, unstable_cache } from 'next/cache'
import { redirect } from 'next/navigation'
import { courseBuilderAdapter, db } from '@/db'
import { eggheadPgQuery } from '@/db/eggheadPostgres'
import {
	contentContributions,
	contentResource,
	contentResourceResource,
	contentResourceTag as contentResourceTagTable,
	contentResourceVersion as contentResourceVersionTable,
	contributionTypes,
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

import { POST_CREATED_EVENT } from '@/inngest/events/post-created'
import { inngest } from '@/inngest/inngest.server'
import { sanityWriteClient } from '@/server/sanity-write-client'
import { last } from 'lodash'

import { getMuxAsset } from '@coursebuilder/core/lib/mux'
import {
	ContentResource,
	ContentResourceSchema,
} from '@coursebuilder/core/schemas'

import {
	clearPublishedAt,
	createEggheadLesson,
	determineEggheadAccess,
	determineEggheadLessonState,
	determineEggheadVisibilityState,
	getEggheadUserProfile,
	setPublishedAt,
	updateEggheadLesson,
	writeLegacyTaggingsToEgghead,
} from './egghead'
import { SanityLessonDocumentSchema } from './sanity-content'
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

export async function createPost(input: NewPost) {
	const { session, ability } = await getServerAuthSession()

	if (!session?.user?.id || !ability.can('create', 'Content')) {
		throw new Error('Unauthorized')
	}

	const profile = await getEggheadUserProfile(session.user.id)
	const post = writeNewPostToDatabase({
		newPost: input,
		eggheadInstructorId: profile.instructor.id,
		createdById: session.user.id,
	})

	if (post) {
		await inngest.send({
			name: POST_CREATED_EVENT,
			data: {
				post: await post,
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
	await db
		.delete(contentResourceTagTable)
		.where(
			and(
				eq(contentResourceTagTable.contentResourceId, postId),
				eq(contentResourceTagTable.tagId, tagId),
			),
		)
	await writeLegacyTaggingsToEgghead(postId)
}

export async function writeNewPostToDatabase(input: {
	newPost: NewPost
	eggheadInstructorId: number
	createdById: string
}) {
	const { title, videoResourceId } = input.newPost
	const { eggheadInstructorId, createdById } = input
	const postGuid = guid()
	const newPostId = `post_${postGuid}`
	const videoResource =
		await courseBuilderAdapter.getVideoResource(videoResourceId)

	const TYPES_WITH_LESSONS = ['lesson', 'podcast', 'tip']
	const eggheadLessonId = TYPES_WITH_LESSONS.includes(input.newPost.postType)
		? await createEggheadLesson({
				title: title,
				slug: `${slugify(title)}~${postGuid}`,
				instructorId: eggheadInstructorId,
				guid: postGuid,
				...(videoResource?.muxPlaybackId && {
					hlsUrl: `https://stream.mux.com/${videoResource.muxPlaybackId}.m3u8`,
				}),
			})
		: null

	if (eggheadLessonId) {
		const lesson = SanityLessonDocumentSchema.parse({
			_id: `lesson-${eggheadLessonId}`,
			_type: 'lesson',
			title,
			accessLevel: 'pro',
			slug: {
				_type: 'slug',
				current: `${slugify(title)}~${postGuid}`,
			},
			railsLessonId: eggheadLessonId,
		})

		await sanityWriteClient.create(lesson)
	}

	await db
		.insert(contentResource)
		.values({
			id: newPostId,
			type: 'post',
			createdById,
			fields: {
				title,
				state: 'draft',
				visibility: 'unlisted',
				access: 'pro',
				postType: input.newPost.postType,
				slug: `${slugify(title)}~${postGuid}`,
				...(eggheadLessonId ? { eggheadLessonId } : {}),
			},
		})
		.catch((error) => {
			console.error('🚨 Error creating post', error)
			throw error
		})

	const post = await getPost(newPostId)

	if (post && post.fields.eggheadLessonId) {
		await updateSanityLesson(post.fields.eggheadLessonId, post)
		await replaceSanityLessonResources({
			post,
			eggheadLessonId: post.fields.eggheadLessonId,
			videoResourceId: videoResourceId,
		})
	}

	await createNewPostVersion(post)

	if (post) {
		if (videoResource) {
			await db
				.insert(contentResourceResource)
				.values({ resourceOfId: post.id, resourceId: videoResource.id })
		}

		const contributionType = await db.query.contributionTypes.findFirst({
			where: eq(contributionTypes.slug, 'author'),
		})

		if (contributionType) {
			await db.insert(contentContributions).values({
				id: `cc-${guid()}`,
				userId: createdById,
				contentId: post.id,
				contributionTypeId: contributionType.id,
			})
		}

		return post
	}
	return null
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

export async function createNewPostVersion(
	post: Post | null,
	createdById?: string,
) {
	if (!post) return null
	const contentHash = generateContentHash(post)
	const versionId = `version~${contentHash}`

	// Check if this version already exists
	const existingVersion = await db.query.contentResourceVersion.findFirst({
		where: eq(contentResourceVersionTable.id, versionId),
	})

	if (existingVersion) {
		// If this exact version already exists, just update the current version pointer
		await db
			.update(contentResource)
			.set({ currentVersionId: versionId })
			.where(eq(contentResource.id, post.id))
		return post
	}

	// If it's a new version, create it
	await db.transaction(async (trx) => {
		await trx.insert(contentResourceVersionTable).values({
			id: versionId,
			resourceId: post.id,
			parentVersionId: post.currentVersionId,
			versionNumber: (await getLatestVersionNumber(post.id)) + 1,
			fields: {
				...post.fields,
			},
			createdAt: new Date(),
			createdById: createdById ? createdById : post.createdById,
		})

		post.currentVersionId = versionId

		await trx
			.update(contentResource)
			.set({ currentVersionId: versionId })
			.where(eq(contentResource.id, post.id))
	})
	return post
}

export async function getLatestVersionNumber(postId: string): Promise<number> {
	const latestVersion = await db.query.contentResourceVersion.findFirst({
		where: eq(contentResourceVersionTable.resourceId, postId),
		orderBy: desc(contentResourceVersionTable.versionNumber),
	})
	return latestVersion ? latestVersion.versionNumber : 0
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

export const addResourceToResource = async ({
	resource,
	resourceId,
}: {
	resource: ContentResource
	resourceId: string
}) => {
	const parentResource = await db.query.contentResource.findFirst({
		where: like(contentResource.id, `%${last(resourceId.split('-'))}%`),
		with: {
			resources: true,
		},
	})

	if (!parentResource) {
		throw new Error(`Workshop with id ${resourceId} not found`)
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
