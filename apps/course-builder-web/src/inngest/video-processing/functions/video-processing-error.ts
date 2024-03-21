import { inngest } from '@/inngest/inngest.server'

import { MUX_WEBHOOK_EVENT } from '@coursebuilder/core/inngest/video-processing/events'

export const videoProcessingError = inngest.createFunction(
  { id: `mux-video-asset-error`, name: 'Mux Video Asset Errored' },
  {
    event: MUX_WEBHOOK_EVENT,
    if: 'event.data.muxWebhookEvent.type == "video.asset.errored"',
  },
  async ({ event, step, db, partyKitRootUrl }) => {
    const videoResource = await step.run('Load Video Resource', async () => {
      return db.getVideoResource(event.data.muxWebhookEvent.data.passthrough)
    })

    if (!videoResource) {
      throw new Error('Video Resource not found')
    }

    await step.run(
      'update the video resource in Sanity as errored',
      async () => {
        return db.updateContentResourceFields({
          id: videoResource._id as string,
          fields: {
            state: 'errored',
          },
        })
      },
    )

    await step.run('announce asset errored', async () => {
      const roomName = event.data.muxWebhookEvent.data.passthrough
      await fetch(`${partyKitRootUrl}/party/${roomName}`, {
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
