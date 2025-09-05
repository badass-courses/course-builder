'use server'

import { eggheadPgQuery, getEggheadPostgresClient } from '@/db/eggheadPostgres'
import { EggheadResource, EggheadResourceType } from '@/lib/egghead/types'
import { Post } from '@/lib/posts'
import { getPost } from '@/lib/posts-query'

/**
 * Gets resource info for a post
 * @param post - The post to get resource info for
 * @returns The resource info object or undefined
 */
function getResourceInfo(post: Post): EggheadResource | undefined {
	// Events don't have egghead resource IDs and don't need to be synced to Egghead
	if (post.type === 'event') {
		return undefined
	}

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
 * Builds tagging queries for a post
 * @param post - The post to build tagging queries for
 * @returns Array of SQL queries for tagging
 */
function buildTaggingQueries(post: Post): string[] {
	const eggheadResource = getResourceInfo(post)
	if (!eggheadResource) {
		throw new Error('No egghead resource found')
	}

	const { id, type } = eggheadResource
	const queries: string[] = []

	for (const tag of post?.tags?.map((tag) => tag.tag) || []) {
		const tagId = Number(tag.id.split('_')[1])
		queries.push(`
			INSERT INTO taggings (tag_id, taggable_id, taggable_type, context, created_at, updated_at)
			VALUES (${tagId}, ${id}, '${type}', 'topics', NOW(), NOW())
		`)
	}

	return queries
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

	const eggheadResource = getResourceInfo(post)
	if (!eggheadResource) {
		// Events and other resources without egghead IDs don't need to be synced to Egghead
		console.log(
			`Skipping Egghead sync for ${post.type} ${postId} - no egghead resource ID`,
		)
		return
	}

	return eggheadPgQuery(
		`DELETE FROM taggings WHERE taggings.taggable_id = $1 AND taggings.taggable_type = $2`,
		[eggheadResource.id, eggheadResource.type],
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

	const eggheadResource = getResourceInfo(post)
	if (!eggheadResource) {
		// Events and other resources without egghead IDs don't need to be synced to Egghead
		console.log(
			`Skipping Egghead sync for ${post.type} ${postId} - no egghead resource ID`,
		)
		return
	}

	if (!post.tags || post.tags.length === 0) {
		return
	}

	const client = await getEggheadPostgresClient()

	try {
		await client.query('BEGIN')

		await client.query(
			`DELETE FROM taggings WHERE taggings.taggable_id = $1 AND taggings.taggable_type = $2`,
			[eggheadResource.id, eggheadResource.type],
		)

		const tagQueries = buildTaggingQueries(post)
		for (const query of tagQueries) {
			await client.query(query)
		}

		await client.query('COMMIT')
	} catch (error) {
		await client.query('ROLLBACK')
		console.error(
			`Error writing taggings to Egghead for post ${postId}:`,
			error,
		)
		throw error
	} finally {
		client.release()
	}
}
