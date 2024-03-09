import { revalidateTag } from 'next/cache'
import { db } from '@/db'
import { contentResource } from '@/db/schema'
import { env } from '@/env.mjs'
import { inngest } from '@/inngest/inngest.server'
import { MUX_WEBHOOK_EVENT } from '@/inngest/video-processing/events/video-mux-webhook'
import { getVideoResource } from '@/lib/video-resource-query'
import { sql } from 'drizzle-orm'

export const videoReady = inngest.createFunction(
  { id: `mux-video-asset-ready`, name: 'Mux Video Asset Ready' },
  {
    event: MUX_WEBHOOK_EVENT,
    if: 'event.data.muxWebhookEvent.type == "video.asset.ready"',
  },
  async ({ event, step }) => {
    const videoResource = await step.run('Load Video Resource', async () => {
      return getVideoResource(event.data.muxWebhookEvent.data.passthrough)
    })

    if (videoResource) {
      await step.run('update the video resource in database', async () => {
        const query = sql`
          UPDATE ${contentResource}
          SET
            ${contentResource.fields} = JSON_SET(
              ${contentResource.fields}, '$.state', 'ready')
          WHERE
            id = ${videoResource._id};
        `
        return db
          .execute(query)
          .then((result) => {
            console.log('📼 updated video resource', result)
            return result
          })
          .catch((error) => {
            console.error(error)
            throw error
          })
      })
      revalidateTag(videoResource._id)
    }

    await step.run('announce asset ready', async () => {
      const roomName = event.data.muxWebhookEvent.data.passthrough || env.NEXT_PUBLIC_PARTYKIT_ROOM_NAME

      revalidateTag(roomName)

      await fetch(`${env.NEXT_PUBLIC_PARTY_KIT_URL}/party/${roomName}`, {
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
