import { env } from '@/env.mjs'
import { IMAGE_RESOURCE_CREATED_EVENT } from '@/inngest/events/image-resource-created'
import { inngest } from '@/inngest/inngest.server'

export const imageResourceCreated = inngest.createFunction(
	{ id: `image-resource-created`, name: 'Image Resource Created' },
	{
		event: IMAGE_RESOURCE_CREATED_EVENT,
	},
	async ({ event, step, partyProvider }) => {
		await step.run('announce asset created', async () => {
			await partyProvider.broadcastMessage({
				body: {
					body: event.data,
					requestId: event.data.resourceId,
					name: 'image.resource.created',
				},
				roomId: env.NEXT_PUBLIC_PARTYKIT_ROOM_NAME,
			})
		})

		return event.data.resourceId
	},
)
