import { writeLegacyTaggingsToEgghead } from '@/lib/egghead'
import { getPost } from '@/lib/posts-query'
import { NonRetriableError } from 'inngest'
import { z } from 'zod'

import { inngest } from '../inngest.server'

export const POST_UPDATED_EVENT = 'post/updated'

export type PostUpdated = {
	name: typeof POST_UPDATED_EVENT
	data: PostUpdatedEvent
}
export const PostUpdatedEventSchema = z.object({
	postId: z.string(),
})

export type PostUpdatedEvent = z.infer<typeof PostUpdatedEventSchema>

export const syncPostToEgghead = inngest.createFunction(
	{ id: 'sync-post-to-egghead', name: 'Sync Post to Egghead' },
	{
		event: POST_UPDATED_EVENT,
	},
	async ({ event, step }) => {
		const post = await step.run('Get post', async () => {
			const post = await getPost(event.data.postId)

			return post
		})

		if (!post) {
			throw new NonRetriableError(
				`Post with id ${event.data.postId} not found.`,
			)
		}

		await step.run('write taggings to egghead', async () => {
			return writeLegacyTaggingsToEgghead(post.id)
		})

		return event.data.postId
	},
)
