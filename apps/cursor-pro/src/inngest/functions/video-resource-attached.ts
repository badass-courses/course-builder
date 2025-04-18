import { env } from '@/env.mjs'
import { inngest } from '@/inngest/inngest.server'

import {
	VIDEO_ATTACHED_EVENT,
	VIDEO_DETACHED_EVENT,
} from '../events/video-attachment'

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

export const videoResourceDetached = inngest.createFunction(
	{ id: `video-resource-detached`, name: 'Video Resource Detached' },
	{
		event: VIDEO_DETACHED_EVENT,
	},
	async ({ event, step, partyProvider }) => {
		await step.run('announce video asset detached', async () => {
			await partyProvider.broadcastMessage({
				roomId: event.data.postId,
				body: {
					body: event.data,
					requestId: event.data.videoResourceId,
					name: 'video.asset.detached',
				},
			})
		})

		return event.data.videoResourceId
	},
)
