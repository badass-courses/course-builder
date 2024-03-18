import { revalidateTag } from 'next/cache'
import { env } from '@/env.mjs'
import { inngest } from '@/inngest/inngest.server'
import { updateVideoStatus } from '@/lib/video-resource-query'

import { MUX_WEBHOOK_EVENT } from '@coursebuilder/core/inngest/video-processing/events'

export const videoProcessingError = inngest.createFunction(
  { id: `mux-video-asset-error`, name: 'Mux Video Asset Errored' },
  {
    event: MUX_WEBHOOK_EVENT,
    if: 'event.data.muxWebhookEvent.type == "video.asset.errored"',
  },
  async ({ event, step, db }) => {
    const videoResource = await step.run('Load Video Resource', async () => {
      return db.getVideoResource(event.data.muxWebhookEvent.data.passthrough)
    })

    if (!videoResource) {
      throw new Error('Video Resource not found')
    }

    await step.run('update the video resource in Sanity as errored', async () => {
      return updateVideoStatus({ videoResourceId: videoResource._id, status: 'errored' })
    })

    await step.run('announce asset errored', async () => {
      const roomName = event.data.muxWebhookEvent.data.passthrough || env.NEXT_PUBLIC_PARTYKIT_ROOM_NAME
      revalidateTag(roomName)
      await fetch(`${env.NEXT_PUBLIC_PARTY_KIT_URL}/party/${roomName}`, {
        method: 'POST',
        body: JSON.stringify({
          body: `Mux Asset Errored: ${event.data.muxWebhookEvent.data.id}`,
          requestId: event.data.muxWebhookEvent.data.passthrough,
        }),
      }).catch((e) => {
        console.error(e)
      })
    })
    return event.data.muxWebhookEvent.data
  },
)
