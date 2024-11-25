import { eggheadPgQuery } from '@/db/eggheadPostgres'
import {
	getAllPostIds,
	getPost,
	writePostUpdateToDatabase,
} from '@/lib/posts-query'
import { z } from 'zod'

import { inngest } from '../inngest.server'

export const SYNC_POSTS_TO_EGGHEAD_LESSONS_EVENT =
	'posts/sync-to-egghead-lessons'

export type SyncPostsToEggheadLessonsEvent = {
	name: typeof SYNC_POSTS_TO_EGGHEAD_LESSONS_EVENT
	data: {}
}

export const syncPostsToEggheadLessons = inngest.createFunction(
	{
		id: 'sync-posts-to-egghead-lessons',
		name: 'Sync ALL lesson posts to egghead lessons',
	},
	{ event: SYNC_POSTS_TO_EGGHEAD_LESSONS_EVENT },
	async ({ event, step }) => {
		const postIds = await step.run('Get post ids', async () => {
			return await getAllPostIds()
		})

		// Process each post ID sequentially to avoid race conditions
		for (const postId of postIds) {
			const post = await step.run(`load-post-${postId}`, async () => {
				return await getPost(postId)
			})

			if (!post) {
				continue
			}

			await step.run(`sync-post-${postId}`, async () => {
				const eggheadLessonId = post.fields.eggheadLessonId

				if (eggheadLessonId) {
					await writePostUpdateToDatabase({
						postUpdate: post,
						action: 'save',
						updatedById: 'egghead',
					})
				}
			})
		}

		return { success: true }
	},
)
