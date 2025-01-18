import { courseBuilderAdapter } from '@/db'
import {
	NewPostInputSchema,
	PostActionSchema,
	PostUpdateSchema,
	type PostAction,
} from '@/lib/posts'
import { Ability, subject } from '@casl/ability'

import {
	deletePostFromDatabase,
	getAllPostsForUser,
	getPost,
	writeNewPostToDatabase,
	writePostUpdateToDatabase,
} from './posts-query'

export class PostError extends Error {
	constructor(
		message: string,
		public statusCode: number = 400,
		public details?: unknown,
	) {
		super(message)
	}
}

export async function createPost({
	data,
	userId,
	ability,
}: {
	data: unknown
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
		const post = await getPost(slug)
		if (!post) {
			throw new PostError('Post not found', 404)
		}
		if (ability.can('read', subject('Content', post))) {
			return post
		}
		throw new PostError('Unauthorized', 401)
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
	const actionResult = PostActionSchema.safeParse(action || 'save')
	if (!actionResult.success) {
		throw new PostError('Invalid action', 400, actionResult.error)
	}

	const validatedData = PostUpdateSchema.safeParse(data)
	if (!validatedData.success) {
		throw new PostError('Invalid input', 400, validatedData.error)
	}

	const originalPost = await getPost(id)
	if (!originalPost) {
		throw new PostError('Post not found', 404)
	}

	if (ability.cannot('manage', subject('Content', originalPost))) {
		throw new PostError('Unauthorized', 401)
	}

	try {
		return await writePostUpdateToDatabase({
			currentPost: originalPost,
			postUpdate: validatedData.data,
			action: actionResult.data,
			updatedById: userId,
		})
	} catch (error) {
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
		return { message: 'Post deleted successfully' }
	} catch (error) {
		throw new PostError('Failed to delete post', 500, error)
	}
}
