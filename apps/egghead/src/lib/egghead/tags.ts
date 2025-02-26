'use server'

import { eggheadPgQuery } from '@/db/eggheadPostgres'
import { Post } from '@/lib/posts'
import { getPost } from '@/lib/posts-query'

/**
 * Gets resource info for a post
 * @param post - The post to get resource info for
 * @returns The resource info object or undefined
 */
function getResourceInfo(post: Post) {
	if (post.fields.eggheadLessonId) {
		return {
			id: post.fields.eggheadLessonId,
			type: 'Lesson',
		}
	}

	if (post.fields.eggheadPlaylistId) {
		return {
			id: post.fields.eggheadPlaylistId,
			type: 'Playlist',
		}
	}

	return undefined
}

/**
 * Builds a tagging query for a post
 * @param post - The post to build tagging query for
 * @returns The SQL query string for tagging
 */
function buildTaggingQuery(post: Post) {
	const eggheadResource = getResourceInfo(post)
	if (!eggheadResource) {
		throw new Error('No egghead resource found')
	}

	let query = ``
	for (const tag of post?.tags?.map((tag) => tag.tag) || []) {
		const tagId = Number(tag.id.split('_')[1])
		query += `INSERT INTO taggings (tag_id, taggable_id, taggable_type, context, created_at, updated_at)
					VALUES (${tagId}, ${eggheadResource.id}, '${eggheadResource.type}', 'topics', NOW(), NOW());
		`
	}

	return query
}

/**
 * Removes legacy taggings for a post from Egghead
 * @param postId - The post ID to remove taggings for
 */
export async function removeLegacyTaggingsOnEgghead(postId: string) {
	const post = await getPost(postId)

	if (!post) {
		throw new Error(`Post with id ${postId} not found.`)
	}

	const eggheadResourceId =
		post.fields.eggheadLessonId || post.fields.eggheadPlaylistId

	return eggheadPgQuery(
		`DELETE FROM taggings WHERE taggings.taggable_id = ${eggheadResourceId}`,
	)
}

/**
 * Writes legacy taggings for a post to Egghead
 * @param postId - The post ID to write taggings for
 */
export async function writeLegacyTaggingsToEgghead(postId: string) {
	const post = await getPost(postId)

	if (!post) {
		throw new Error(`Post with id ${postId} not found.`)
	}

	// just wipe them and rewrite, no need to be smart
	await removeLegacyTaggingsOnEgghead(postId)

	if (!post?.tags) return

	const query = buildTaggingQuery(post)
	Boolean(query) && (await eggheadPgQuery(query))
}
