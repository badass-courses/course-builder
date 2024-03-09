import { revalidateTag } from 'next/cache'
import { db } from '@/db'
import { contentResource } from '@/db/schema'
import { env } from '@/env.mjs'
import { MUX_WEBHOOK_EVENT } from '@/inngest/events/mux-webhook'
import { inngest } from '@/inngest/inngest.server'
import { getVideoResource } from '@/lib/video-resource-query'
import { sql } from 'drizzle-orm'

export const muxVideoAssetCreated = inngest.createFunction(
  { id: `mux-video-asset-created`, name: 'Mux Video Asset Created' },
  {
    event: MUX_WEBHOOK_EVENT,
    if: 'event.data.muxWebhookEvent.type == "video.asset.created"',
  },
  async ({ event, step }) => {
    await step.run('announce asset created', async () => {
      const roomName = event.data.muxWebhookEvent.data.passthrough || env.NEXT_PUBLIC_PARTYKIT_ROOM_NAME
      revalidateTag(roomName)
      await fetch(`${env.NEXT_PUBLIC_PARTY_KIT_URL}/party/${roomName}`, {
        method: 'POST',
        body: JSON.stringify({
          body: `Mux Asset created: ${event.data.muxWebhookEvent.data.id}`,
          requestId: event.data.muxWebhookEvent.data.passthrough,
        }),
      }).catch((e) => {
        console.error(e)
      })
    })
    return event.data.muxWebhookEvent.data
  },
)

export const muxVideoAssetError = inngest.createFunction(
  { id: `mux-video-asset-error`, name: 'Mux Video Asset Errored' },
  {
    event: MUX_WEBHOOK_EVENT,
    if: 'event.data.muxWebhookEvent.type == "video.asset.errored"',
  },
  async ({ event, step }) => {
    const videoResource = await step.run('Load Video Resource', async () => {
      return getVideoResource(event.data.muxWebhookEvent.data.passthrough)
    })

    if (videoResource) {
      await step.run('update the video resource in Sanity as errored', async () => {
        const query = sql`
          UPDATE ${contentResource}
          SET
            ${contentResource.fields} = JSON_SET(
              ${contentResource.fields}, '$.state', 'errored')
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

export const muxVideoAssetReady = inngest.createFunction(
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
