'use server'

import crypto from 'node:crypto'
import { revalidatePath, revalidateTag, unstable_cache } from 'next/cache'
import { redirect } from 'next/navigation'
import { courseBuilderAdapter, db } from '@/db'
import {
	contentContributions,
	contentResource,
	contentResourceResource,
	contentResourceTag as contentResourceTagTable,
	contentResourceVersion as contentResourceVersionTable,
	contributionTypes,
} from '@/db/schema'
import {
	NewPost,
	NewPostInput,
	NewPostInputSchema,
	Post,
	PostAction,
	PostSchema,
	type PostUpdate,
} from '@/lib/posts'
import { getServerAuthSession } from '@/server/auth'
import { guid } from '@/utils/guid'
import { subject } from '@casl/ability'
import slugify from '@sindresorhus/slugify'
import { and, asc, desc, eq, inArray, or, sql } from 'drizzle-orm'
import readingTime from 'reading-time'
import { v4 } from 'uuid'
import { z } from 'zod'

import { getMuxAsset } from '@coursebuilder/core/lib/mux'

import { ListSchema, type List } from './lists'
import { DatabaseError, PostCreationError } from './post-errors'
import { generateContentHash, updatePostSlug } from './post-utils'
import { TagSchema, type Tag } from './tags'
import { deletePostInTypeSense, upsertPostToTypeSense } from './typesense-query'

export const getCachedAllPosts = unstable_cache(
	async () => getAllPosts(),
	['posts'],
	{ revalidate: 3600, tags: ['posts'] },
)

export async function getAllPosts(): Promise<Post[]> {
	const posts = await db.query.contentResource.findMany({
		where: eq(contentResource.type, 'post'),
		orderBy: desc(contentResource.createdAt),
		with: {
			tags: {
				with: {
					tag: true,
				},
				orderBy: asc(contentResourceTagTable.position),
			},
			createdBy: {
				with: {
					contributions: true,
				},
			},
		},
	})
	// return posts
	const postsParsed = z.array(PostSchema).safeParse(posts)
	if (!postsParsed.success) {
		console.error('Error parsing posts', postsParsed.error)
		return []
	}

	return postsParsed.data
}

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

export async function getPostTags(postId: string): Promise<Tag[]> {
	const tags = await db.query.contentResourceTag.findMany({
		where: eq(contentResourceTagTable.contentResourceId, postId),
		with: {
			tag: true,
		},
	})

	return z.array(TagSchema).parse(tags.map((tag) => tag.tag))
}

export async function getPostLists(postId: string): Promise<List[]> {
	const lists = await db.query.contentResourceResource.findMany({
		where: eq(contentResourceResource.resourceId, postId),
		with: {
			resourceOf: true,
		},
	})

	const listResources = lists
		.filter((list) => list.resourceOf.type === 'list')
		.map((list) => list.resourceOf)

	return z.array(ListSchema).parse(listResources)
}

export async function getPosts(): Promise<Post[]> {
	const { ability } = await getServerAuthSession()

	const visibility: ('public' | 'private' | 'unlisted')[] = ability.can(
		'update',
		'Content',
	)
		? ['public', 'private', 'unlisted']
		: ['public']
	const states: ('draft' | 'published')[] = ability.can('update', 'Content')
		? ['draft', 'published']
		: ['published']

	const posts = await db.query.contentResource.findMany({
		where: and(
			eq(contentResource.type, 'post'),
			inArray(
				sql`JSON_EXTRACT (${contentResource.fields}, "$.visibility")`,
				visibility,
			),
			inArray(sql`JSON_EXTRACT (${contentResource.fields}, "$.state")`, states),
		),
		orderBy: desc(contentResource.createdAt),
	})

	const postsParsed = z.array(PostSchema).safeParse(posts)
	if (!postsParsed.success) {
		console.error('Error parsing posts', postsParsed)
		return []
	}

	return postsParsed.data
}

export async function createPost(input: NewPost) {
	const { session, ability } = await getServerAuthSession()
	const user = session?.user
	if (!user || !ability.can('create', 'Content')) {
		throw new Error('Unauthorized')
	}

	const postGuid = guid()
	const newPostId = `post_${postGuid}`

	const postValues = {
		id: newPostId,
		type: 'post',
		createdById: user.id,
		fields: {
			title: input.title,
			state: 'draft',
			visibility: 'public',
			slug: slugify(`${input.title}~${postGuid}`),
		},
	}
	await db
		.insert(contentResource)
		.values(postValues)
		.catch((error) => {
			console.error('🚨 Error creating post', error)
			throw error
		})

	const post = await getPost(newPostId)
	if (post) {
		if (input?.videoResourceId) {
			await db
				.insert(contentResourceResource)
				.values({ resourceOfId: post.id, resourceId: input.videoResourceId })
		}

		try {
			await upsertPostToTypeSense(post, 'save')
		} catch (e) {
			console.error('Failed to create post in Typesense', e)
		}

		revalidateTag('posts', 'max')

		return post
	} else {
		throw new Error('🚨 Error creating post: Post not found')
	}
}

export async function autoUpdatePost(
	input: PostUpdate,
	action: 'save' | 'publish' | 'archive' | 'unpublish' = 'save',
) {
	return await updatePost(input, action, false)
}

export async function updatePost(
	input: PostUpdate,
	action: 'save' | 'publish' | 'archive' | 'unpublish' = 'save',
	revalidate = true,
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

	let postSlug = currentPost.fields.slug

	if (
		input.fields.title !== currentPost.fields.title &&
		input.fields.slug.includes('~')
	) {
		const splitSlug = currentPost?.fields.slug.split('~') || ['', guid()]
		postSlug = `${slugify(input.fields.title)}~${splitSlug[1] || guid()}`
	} else if (input.fields.slug !== currentPost.fields.slug) {
		postSlug = input.fields.slug
	}

	try {
		await upsertPostToTypeSense(
			{
				...currentPost,
				fields: {
					...currentPost.fields,
					...input.fields,
					description: input.fields.description || '',
					slug: postSlug,
				},
			},
			action,
		)
	} catch (e) {
		console.error('Failed to update post in Typesense', e)
	}

	revalidate && revalidateTag('posts', 'max')

	return courseBuilderAdapter.updateContentResourceFields({
		id: currentPost.id,
		fields: {
			...currentPost.fields,
			...input.fields,
			slug: postSlug,
		},
	})
}

export const getCachedPost = unstable_cache(
	async (slug: string) => getPost(slug),
	['posts'],
	{ revalidate: 3600, tags: ['posts'] },
)

export async function getPost(slugOrId: string) {
	const { ability } = await getServerAuthSession()

	const visibility: ('public' | 'private' | 'unlisted')[] = ability.can(
		'update',
		'Content',
	)
		? ['public', 'private', 'unlisted']
		: ['public', 'unlisted']
	const states: ('draft' | 'published')[] = ability.can('update', 'Content')
		? ['draft', 'published']
		: ['published']

	const post = await db.query.contentResource.findFirst({
		where: and(
			or(
				eq(sql`JSON_EXTRACT (${contentResource.fields}, "$.slug")`, slugOrId),
				eq(contentResource.id, slugOrId),
				eq(contentResource.id, `post_${slugOrId.split('~')[1]}`),
			),
			eq(contentResource.type, 'post'),
			inArray(
				sql`JSON_EXTRACT (${contentResource.fields}, "$.visibility")`,
				visibility,
			),
			inArray(sql`JSON_EXTRACT (${contentResource.fields}, "$.state")`, states),
		),
		with: {
			resources: {
				with: {
					resource: true,
				},
				orderBy: asc(contentResourceResource.position),
			},
			tags: {
				with: {
					tag: true,
				},
				orderBy: asc(contentResourceTagTable.position),
			},
		},
	})

	if (!post) {
		console.debug('Post not found or not accessible', {
			slugOrId,
			visibility,
			states,
		})
		return null
	}

	const postParsed = PostSchema.safeParse(post)
	if (!postParsed.success) {
		console.debug('Error parsing post schema', {
			slugOrId,
			error: postParsed.error,
		})
		return null
	}

	return postParsed.data
}

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

	await db
		.delete(contentResourceResource)
		.where(eq(contentResourceResource.resourceOfId, id))

	await db.delete(contentResource).where(eq(contentResource.id, id))

	await deletePostInTypeSense(post.id)

	revalidateTag('posts', 'max')
	revalidateTag(id, 'max')
	revalidatePath('/posts')

	return true
}

export async function addTagToPost(postId: string, tagId: string) {
	await db.insert(contentResourceTagTable).values({
		contentResourceId: postId,
		tagId,
	})
}

export async function updatePostTags(postId: string, tags: Tag[]) {
	await db.transaction(async (trx) => {
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
}

export async function writeNewPostToDatabase(
	input: NewPostInput,
): Promise<Post> {
	try {
		const validatedInput = NewPostInputSchema.parse(input)
		const { title, videoResourceId, postType, createdById } = validatedInput

		const postGuid = guid()
		const newPostId = `post_${postGuid}`

		// Step 1: Get video resource if needed
		let videoResource = null
		if (videoResourceId) {
			videoResource =
				await courseBuilderAdapter.getVideoResource(videoResourceId)
		}

		try {
			// Step 3: Create the core post
			const post = await createCorePost({
				newPostId,
				title,
				postGuid,
				postType,
				createdById,
			})

			// Step 4: Handle contributions
			await handleContributions({
				createdById,
				postId: post.id,
				postGuid,
			})

			// Step 6: Create version
			await createNewPostVersion(post)

			return post
		} catch (error) {
			if (error instanceof PostCreationError) {
				throw error
			}

			throw new PostCreationError('Failed to create post', error, {
				input: validatedInput,
			})
		}
	} catch (error) {
		if (error instanceof z.ZodError) {
			throw new PostCreationError('Invalid input for post creation', error, {
				input,
			})
		}
		throw error
	}
}

async function createCorePost({
	newPostId,
	title,
	postGuid,
	postType,
	createdById,
}: {
	newPostId: string
	title: string
	postGuid: string
	postType: string
	createdById: string
}): Promise<Post> {
	try {
		await db.insert(contentResource).values({
			id: newPostId,
			type: 'post',
			createdById,
			fields: {
				title,
				state: 'draft',
				visibility: 'public',
				slug: `${slugify(title)}~${postGuid}`,
				postType,
				access: 'pro',
			},
		})

		const post = await getPost(newPostId)

		if (!post) {
			throw new Error('Post not found after creation')
		}

		return post
	} catch (error) {
		throw new DatabaseError('create core post', error, { newPostId, title })
	}
}

async function handleContributions({
	createdById,
	postId,
	postGuid,
}: {
	createdById: string
	postId: string
	postGuid: string
}) {
	try {
		const contributionType = await db.query.contributionTypes.findFirst({
			where: eq(contributionTypes.slug, 'author'),
		})

		if (contributionType) {
			await db.insert(contentContributions).values({
				id: `cc-${postGuid}`,
				userId: createdById,
				contentId: postId,
				contributionTypeId: contributionType.id,
			})
		}
	} catch (error) {
		throw new DatabaseError('handle contributions', error, {
			createdById,
			postId,
		})
	}
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

	await courseBuilderAdapter.updateContentResourceFields({
		id: currentPost.id,
		fields: {
			...currentPost.fields,
			...postUpdate.fields,
			duration,
			timeToRead,
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

	await upsertPostToTypeSense(updatedPost, action)

	return updatedPost
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

export async function deletePostFromDatabase(id: string) {
	const post = PostSchema.nullish().parse(await getPost(id))

	if (!post) {
		throw new Error(`Post with id ${id} not found.`)
	}

	await db
		.delete(contentResourceResource)
		.where(eq(contentResourceResource.resourceOfId, id))

	await db.delete(contentResource).where(eq(contentResource.id, id))

	return true
}
