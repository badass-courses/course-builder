import crypto from 'crypto'
import { courseBuilderAdapter, db } from '@/db'
import { eggheadPgQuery } from '@/db/eggheadPostgres'
import {
	contentContributions,
	contentResource,
	contentResourceResource,
	contentResourceVersion as contentResourceVersionTable,
	contributionTypes,
} from '@/db/schema'
import { guid } from '@/utils/guid'
import slugify from '@sindresorhus/slugify'
import { desc, eq } from 'drizzle-orm'
import readingTime from 'reading-time'
import { z } from 'zod'

import { getMuxAsset } from '@coursebuilder/core/lib/mux'
import { ContentResourceSchema } from '@coursebuilder/core/schemas/content-resource-schema'

import {
	crreateEggheadLesson,
	determineEggheadLessonState,
	determineEggheadVisibilityState,
	updateEggheadLesson,
} from './egghead'
import { getPost } from './posts-query'
import { upsertPostToTypeSense } from './typesense'

export const PostActionSchema = z.union([
	z.literal('publish'),
	z.literal('unpublish'),
	z.literal('archive'),
	z.literal('save'),
])

export type PostAction = z.infer<typeof PostActionSchema>

export const PostStateSchema = z.union([
	z.literal('draft'),
	z.literal('published'),
	z.literal('archived'),
	z.literal('deleted'),
])

export type PostState = z.infer<typeof PostStateSchema>

export const PostVisibilitySchema = z.union([
	z.literal('public'),
	z.literal('private'),
	z.literal('unlisted'),
])

export type PostVisibility = z.infer<typeof PostVisibilitySchema>

export const PostTypeSchema = z.union([
	z.literal('article'),
	z.literal('lesson'),
	z.literal('podcast'),
])

export type PostType = z.infer<typeof PostTypeSchema>

export const PostSchema = ContentResourceSchema.merge(
	z.object({
		fields: z.object({
			title: z.string(),
			postType: PostTypeSchema.default('lesson'),
			summary: z.string().optional().nullable(),
			body: z.string().nullable().optional(),
			state: PostStateSchema.default('draft'),
			visibility: PostVisibilitySchema.default('public'),
			eggheadLessonId: z.coerce.number().nullish(),
			slug: z.string(),
			description: z.string().nullish(),
			github: z.string().nullish(),
			gitpod: z.string().nullish(),
		}),
		tags: z.array(z.any()),
		currentVersionId: z.string().nullish(),
	}),
)

export type Post = z.infer<typeof PostSchema>

export const NewPostSchema = z.object({
	title: z.string().min(2).max(90),
	videoResourceId: z.string().min(4, 'Please upload a video').nullish(),
})

export type NewPost = z.infer<typeof NewPostSchema>

export const PostUpdateSchema = z.object({
	id: z.string(),
	fields: z.object({
		title: z.string().min(2).max(90),
		postType: PostTypeSchema.optional().default('lesson'),
		body: z.string().optional().nullable(),
		visibility: PostVisibilitySchema.optional().default('public'),
		state: PostStateSchema.optional().default('draft'),
	}),
})

export type PostUpdate = z.infer<typeof PostUpdateSchema>

export async function writePostUpdateToDatabase(input: {
	currentPost: Post
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

	if (postUpdate.fields.title !== currentPost.fields.title) {
		const splitSlug = currentPost?.fields.slug.split('~') || ['', guid()]
		postSlug = `${slugify(postUpdate.fields.title ?? '')}~${splitSlug[1] || guid()}`
	}

	const lessonState = determineEggheadLessonState(
		action,
		postUpdate.fields.state,
	)
	const lessonVisibilityState = determineEggheadVisibilityState(
		postUpdate.fields.visibility,
		postUpdate.fields.state,
	)

	const duration = await getVideoDuration(currentPost.resources)
	const timeToRead = Math.floor(
		readingTime(currentPost.fields.body ?? '').time / 1000,
	)

	if (currentPost.fields.eggheadLessonId) {
		await updateEggheadLesson({
			eggheadLessonId: currentPost.fields.eggheadLessonId,
			state: lessonState,
			visibilityState: lessonVisibilityState,
			duration: duration > 0 ? duration : timeToRead,
		})
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

	const newContentHash = generateContentHash(updatedPost)
	const currentContentHash = currentPost.currentVersionId?.split('~')[1]

	if (newContentHash !== currentContentHash) {
		await createNewPostVersion(updatedPost, updatedById)
	}

	await upsertPostToTypeSense(updatedPost)

	return updatedPost
}

function updatePostSlug(currentPost: Post, newTitle: string): string {
	if (newTitle !== currentPost.fields.title) {
		const splitSlug = currentPost?.fields.slug.split('~') || ['', guid()]
		return `${slugify(newTitle)}~${splitSlug[1] || guid()}`
	}
	return currentPost.fields.slug
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

	const eggheadLessonId = await crreateEggheadLesson({
		title: title,
		slug: `${slugify(title)}~${postGuid}`,
		instructorId: eggheadInstructorId,
	})

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
				slug: `${slugify(title)}~${postGuid}`,
				eggheadLessonId,
			},
		})
		.catch((error) => {
			console.error('🚨 Error creating post', error)
			throw error
		})

	const post = await getPost(newPostId)

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

export async function deletePostFromDatabase(id: string) {
	const post = PostSchema.nullish().parse(
		await db.query.contentResource.findFirst({
			where: eq(contentResource.id, id),
			with: {
				resources: true,
			},
		}),
	)

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

export function generateContentHash(post: Post): string {
	const content = JSON.stringify({
		title: post.fields.title,
		body: post.fields.body,
		description: post.fields.description,
		slug: post.fields.slug,
		// Add any other fields that should be considered for content changes
	})
	return crypto.createHash('sha256').update(content).digest('hex')
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
