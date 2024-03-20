import { inngest } from '@/inngest/inngest.server'

import { MUX_WEBHOOK_EVENT } from '@coursebuilder/core/inngest/video-processing/events'

export const videoReady = inngest.createFunction(
  { id: `mux-video-asset-ready`, name: 'Mux Video Asset Ready' },
  {
    event: MUX_WEBHOOK_EVENT,
    if: 'event.data.muxWebhookEvent.type == "video.asset.ready"',
  },
  async ({ event, step, db, partyKitRootUrl }) => {
    const videoResource = await step.run('Load Video Resource', async () => {
      return db.getVideoResource(event.data.muxWebhookEvent.data.passthrough)
    })

    if (videoResource) {
      await step.run('update the video resource in database', async () => {
        return db.updateContentResourceFields({
          id: videoResource._id as string,
          fields: {
            state: 'ready',
          },
        })
      })
    }

    await step.run('announce asset ready', async () => {
      const roomName = event.data.muxWebhookEvent.data.passthrough

      await fetch(`${partyKitRootUrl}/party/${roomName}`, {
        method: 'POST',
        body: JSON.stringify({
          body: videoResource?.muxPlaybackId,
          requestId: event.data.muxWebhookEvent.data.passthrough,
          name: 'video.asset.ready',
        }),
      }).catch((e) => {
        console.error(e)
      })
    })
    return event.data.muxWebhookEvent.data
  },
)
