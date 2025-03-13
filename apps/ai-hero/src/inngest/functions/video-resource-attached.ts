import { env } from '@/env.mjs'
import { inngest } from '@/inngest/inngest.server'

import { VIDEO_ATTACHED_EVENT } from '../events/video-attachment'

export const videoResourceAttached = inngest.createFunction(
	{ id: `video-resource-attached`, name: 'Video Resource Attached' },
	{
		event: VIDEO_ATTACHED_EVENT,
	},
	async ({ event, step, partyProvider }) => {
		await step.run('announce video asset attached', async () => {
			await partyProvider.broadcastMessage({
				roomId: event.data.postId,
				body: {
					body: event.data,
					requestId: event.data.videoResourceId,
					name: 'video.asset.attached',
				},
			})
		})

		return event.data.videoResourceId
	},
)
