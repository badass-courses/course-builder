import { env } from '@/env.mjs'
import { IMAGE_RESOURCE_CREATED_EVENT } from '@/inngest/events/image-resource-created'
import { inngest } from '@/inngest/inngest.server'

export const imageResourceCreated = inngest.createFunction(
  { id: `image-resource-created`, name: 'Image Resource Created' },
  {
    event: IMAGE_RESOURCE_CREATED_EVENT,
  },
  async ({ event, step }) => {
    await step.run('announce asset created', async () => {
      await fetch(`${env.NEXT_PUBLIC_PARTY_KIT_URL}/party/${env.NEXT_PUBLIC_PARTYKIT_ROOM_NAME}`, {
        method: 'POST',
        body: JSON.stringify({
          body: event.data,
          requestId: event.data.resourceId,
          name: 'image.resource.created',
        }),
      }).catch((e) => {
        console.error(e)
      })
    })

    return event.data.resourceId
  },
)
