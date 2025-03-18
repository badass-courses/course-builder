import { revalidatePath } from 'next/cache'
import { courseBuilderAdapter, db } from '@/db'
import {
	contentResource,
	contentResourceResource,
	contentResourceTag,
} from '@/db/schema'
import {
	NewPostInputSchema,
	PostActionSchema,
	PostSchema,
	PostUpdateSchema,
	type PostAction,
} from '@/lib/posts'
import { Ability, subject } from '@casl/ability'
import { and, asc, eq, inArray, or, sql } from 'drizzle-orm'

import {
	deletePostFromDatabase,
	getAllPostsForUser,
	writeNewPostToDatabase,
	writePostUpdateToDatabase,
} from '../posts-query'

export class PostError extends Error {
	constructor(
		message: string,
		public statusCode: number = 400,
		public details?: unknown,
	) {
		super(message)
	}
}

async function getPost(slugOrId: string, ability: Ability) {
	console.log('🔍 Querying post with slugOrId:', slugOrId)

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
				orderBy: asc(contentResourceTag.position),
			},
		},
	})

	if (!post) {
		console.log('❌ No post found for slugOrId:', slugOrId)
		return null
	}

	const postParsed = PostSchema.safeParse(post)
	if (!postParsed.success) {
		console.error('❌ Error parsing post:', postParsed.error)
		throw new PostError('Invalid post data in database', 500, postParsed.error)
	}

	console.log('✅ Post found:', postParsed.data.id)
	return postParsed.data
}

// New function that doesn't require session
export async function getPostById({
	id,
	ability,
}: {
	id: string
	ability: Ability
}) {
	console.log('🔍 Getting post by ID:', id)
	const post = await getPost(id, ability)

	if (!post) {
		console.log('❌ Post not found:', id)
		throw new PostError('Post not found', 404)
	}

	if (ability.cannot('read', subject('Content', post))) {
		console.log('❌ User lacks permission to read post:', id)
		throw new PostError('Unauthorized', 401)
	}

	console.log('✅ Post retrieved:', post)
	return post
}

export async function createPost({
	data,
	userId,
	ability,
}: {
	data: any
	userId: string
	ability: Ability
}) {
	if (ability.cannot('create', 'Content')) {
		throw new PostError('Unauthorized', 401)
	}

	const validatedData = NewPostInputSchema.safeParse({
		...data,
		createdById: userId,
	})

	if (!validatedData.success) {
		throw new PostError('Invalid input', 400, validatedData.error)
	}

	try {
		return await writeNewPostToDatabase({
			title: validatedData.data.title,
			videoResourceId: validatedData.data.videoResourceId || undefined,
			postType: validatedData.data.postType,
			createdById: userId,
		})
	} catch (error) {
		throw new PostError('Failed to create post', 500, error)
	}
}

export async function getPosts({
	userId,
	ability,
	slug,
}: {
	userId?: string
	ability: Ability
	slug?: string | null
}) {
	if (slug) {
		console.log('🔍 Getting post by slug:', slug)
		const post = await getPost(slug, ability)

		if (!post) {
			console.log('❌ Post not found:', slug)
			throw new PostError('Post not found', 404)
		}

		if (ability.cannot('read', subject('Content', post))) {
			console.log('❌ User lacks permission to read post:', slug)
			throw new PostError('Unauthorized', 401)
		}

		console.log('✅ Post retrieved:', post.id)
		return post
	}

	if (ability.cannot('read', 'Content')) {
		throw new PostError('Unauthorized', 401)
	}

	return getAllPostsForUser(userId)
}

export async function updatePost({
	id,
	data,
	action,
	userId,
	ability,
}: {
	id: string
	data: unknown
	action: unknown
	userId: string
	ability: Ability
}) {
	console.log('🔄 Processing post update request:', {
		id,
		action,
		userId,
		dataKeys: data ? Object.keys(data as object) : [],
	})

	const actionResult = PostActionSchema.safeParse(action || 'save')
	if (!actionResult.success) {
		console.error('❌ Invalid action:', {
			action,
			error: actionResult.error.format(),
		})
		throw new PostError('Invalid action', 400, actionResult.error)
	}

	console.log('🔍 Fetching original post:', id)
	const originalPost = await getPost(id, ability)
	if (!originalPost) {
		console.error('❌ Original post not found:', id)
		throw new PostError('Post not found', 404)
	}

	console.log('🔐 Checking permissions')
	if (ability.cannot('manage', subject('Content', originalPost))) {
		console.error('❌ User lacks permission:', {
			userId,
			postId: id,
			action: actionResult.data,
		})
		throw new PostError('Unauthorized', 401)
	}

	// Handle state transitions for all actions
	const getNewState = (
		action: PostAction,
	): 'draft' | 'published' | 'archived' | 'deleted' => {
		switch (action) {
			case 'publish':
				return 'published'
			case 'unpublish':
				return 'draft'
			case 'archive':
				return 'archived'
			default:
				return originalPost.fields.state
		}
	}

	// For state-changing actions, use current post data with updated state
	const isStateChange = ['publish', 'unpublish', 'archive'].includes(
		actionResult.data,
	)
	const updateData = isStateChange
		? {
				id,
				fields: {
					...originalPost.fields,
					state: getNewState(actionResult.data),
				},
			}
		: data

	console.log('🔍 Validating update data:', {
		action: actionResult.data,
		isStateChange,
		newState: isStateChange ? getNewState(actionResult.data) : undefined,
	})

	const validatedData = PostUpdateSchema.safeParse(updateData)
	if (!validatedData.success) {
		console.error('❌ Invalid update data:', {
			error: validatedData.error.format(),
			data: updateData,
		})
		throw new PostError('Invalid input', 400, validatedData.error)
	}

	try {
		console.log('📝 Writing update to database:', {
			id,
			action: actionResult.data,
			fields: Object.keys(validatedData.data.fields),
		})

		const result = await writePostUpdateToDatabase({
			currentPost: originalPost,
			postUpdate: validatedData.data,
			action: actionResult.data,
			updatedById: userId,
		})
		console.log('✅ Update successful:', {
			id,
			action: actionResult.data,
			newState: result.fields.state,
		})
		console.log('🔄 Revalidating path:', `/${result.fields.slug}`)
		revalidatePath(`/${result.fields.slug}`)

		return result
	} catch (error: any) {
		console.error('❌ Update failed:', {
			id,
			action: actionResult.data,
			error: error.message || error,
			stack: error.stack,
		})
		throw new PostError('Failed to update post', 500, error)
	}
}

export async function deletePost({
	id,
	ability,
}: {
	id: string
	ability: Ability
}) {
	if (!id) {
		throw new PostError('Missing post ID', 400)
	}

	const postToDelete = await courseBuilderAdapter.getContentResource(id)
	if (!postToDelete) {
		throw new PostError('Post not found', 404)
	}

	if (ability.cannot('delete', subject('Content', postToDelete))) {
		throw new PostError('Unauthorized', 401)
	}

	try {
		await deletePostFromDatabase(id)

		console.log('🔄 Revalidating path:', `/${postToDelete.fields?.slug}`)
		revalidatePath(`/${postToDelete.fields?.slug}`)

		return { message: 'Post deleted successfully' }
	} catch (error) {
		throw new PostError('Failed to delete post', 500, error)
	}
}
