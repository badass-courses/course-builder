import { courseBuilderAdapter } from '@/db'
import {
	type NewPostInput,
	type Post,
	type PostAction,
	type PostUpdate,
} from '@/lib/posts'

export async function writeNewPostToDatabase(
	data: NewPostInput,
): Promise<Post> {
	return courseBuilderAdapter.createContentResource({
		...data,
		state: 'draft',
		visibility: 'private',
	})
}

export async function getAllPostsForUser(userId?: string): Promise<Post[]> {
	return courseBuilderAdapter.getContentResources({
		where: userId ? { createdById: userId } : undefined,
	})
}

export async function getPost(slugOrId: string): Promise<Post | null> {
	return courseBuilderAdapter.getContentResource(slugOrId)
}

export async function writePostUpdateToDatabase({
	currentPost,
	postUpdate,
	action,
	updatedById,
}: {
	currentPost: Post
	postUpdate: PostUpdate
	action: PostAction
	updatedById: string
}): Promise<Post> {
	const updates = {
		...postUpdate,
		updatedById,
		updatedAt: new Date(),
	}

	if (action === 'publish') {
		updates.state = 'published'
		updates.visibility = 'public'
	} else if (action === 'unpublish') {
		updates.state = 'draft'
		updates.visibility = 'private'
	} else if (action === 'archive') {
		updates.state = 'archived'
		updates.visibility = 'private'
	}

	return courseBuilderAdapter.updateContentResource(currentPost.id, updates)
}

export async function deletePostFromDatabase(id: string): Promise<void> {
	await courseBuilderAdapter.deleteContentResource(id)
}
