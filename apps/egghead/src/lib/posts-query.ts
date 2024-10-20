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
	contributionTypes,
	users,
} from '@/db/schema'
import {
	createNewPostVersion,
	deletePostFromDatabase,
	generateContentHash,
	getVideoDuration,
	NewPost,
	Post,
	PostAction,
	PostSchema,
	PostState,
	PostUpdate,
	PostVisibility,
	writeNewPostToDatabase,
	writePostUpdateToDatabase,
} from '@/lib/posts'
import { getServerAuthSession } from '@/server/auth'
import { guid } from '@/utils/guid'
import { subject } from '@casl/ability'
import slugify from '@sindresorhus/slugify'
import { and, asc, desc, eq, or, sql } from 'drizzle-orm'
import readingTime from 'reading-time'
import Typesense from 'typesense'
import { z } from 'zod'

import 'server-only'

import { getMuxAsset } from '@coursebuilder/core/lib/mux'

import {
	determineEggheadLessonState,
	determineEggheadVisibilityState,
	EggheadLessonState,
	EggheadLessonVisibilityState,
	getEggheadUserProfile,
	removeLegacyTaggingsOnEgghead,
	updateEggheadLesson,
	writeLegacyTaggingsToEgghead,
} from './egghead'
import { EggheadTag, EggheadTagSchema } from './tags'
import { upsertPostToTypeSense } from './typesense'

export async function deletePost(id: string) {
	const { session, ability } = await getServerAuthSession()
	const user = session?.user

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
		console.error('Error parsing post', parsedPost.error)
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
