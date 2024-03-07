import { revalidateTag } from 'next/cache'
import { db } from '@/db'
import { contentResource } from '@/db/schema'
import { env } from '@/env.mjs'
import { MUX_WEBHOOK_EVENT } from '@/inngest/events/mux-webhook'
import { inngest } from '@/inngest/inngest.server'
import { convertToMigratedVideoResource, VideoResource, VideoResourceSchema } from '@/lib/video-resource'
import { getVideoResource } from '@/lib/video-resource-query'
import { sanityMutation, sanityQuery } from '@/server/sanity.server'
import { eq } from 'drizzle-orm'

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
      const resourceTemp = VideoResourceSchema.safeParse(
        await sanityQuery(`*[_type == "videoResource" && muxAssetId == "${event.data.muxWebhookEvent.data.id}"][0]`, {
          useCdn: false,
        }),
      )
      return resourceTemp.success ? resourceTemp.data : null
    })

    if (videoResource) {
      await step.run('update the video resource in Sanity as errored', async () => {
        return await sanityMutation([
          {
            patch: {
              id: videoResource._id,
              set: {
                state: `errored`,
              },
            },
          },
        ])
      })
      revalidateTag(videoResource._id)

      const updatedVideoResource = await step.run('update the video resource in the database', async () => {
        return sanityQuery<VideoResource | null>(`*[_id == "${videoResource._id}"][0]`)
      })

      if (updatedVideoResource) {
        await step.run('update the video resource in the database', async () => {
          const resourceToUpdate = await db.query.contentResource.findFirst({
            where: eq(contentResource.id, updatedVideoResource._id),
          })

          if (!resourceToUpdate) {
            return
          }
          const migratedResource = convertToMigratedVideoResource({
            videoResource: updatedVideoResource,
            ownerUserId: resourceToUpdate.createdById,
          })

          return db
            .update(contentResource)
            .set(migratedResource)
            .where(eq(contentResource.id, updatedVideoResource._id))
        })
      }
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
      const resourceTemp = VideoResourceSchema.safeParse(
        await sanityQuery(`*[_type == "videoResource" && muxAssetId == "${event.data.muxWebhookEvent.data.id}"][0]`, {
          useCdn: false,
        }),
      )
      return resourceTemp.success ? resourceTemp.data : null
    })

    if (videoResource) {
      await step.run('update the video resource in Sanity', async () => {
        return await sanityMutation([
          {
            patch: {
              id: videoResource._id,
              set: {
                duration: event.data.muxWebhookEvent.data.duration,
                state: `ready`,
              },
            },
          },
        ])
      })
      revalidateTag(videoResource._id)
      const updatedVideoResource = await step.run('reload from sanity', async () => {
        return sanityQuery<VideoResource | null>(`*[_id == "${videoResource._id}"][0]`)
      })

      if (updatedVideoResource) {
        await step.run('update the video resource in the database', async () => {
          const resourceToUpdate = await db.query.contentResource.findFirst({
            where: eq(contentResource.id, updatedVideoResource._id),
          })

          if (!resourceToUpdate) {
            return
          }
          const migratedResource = convertToMigratedVideoResource({
            videoResource: updatedVideoResource,
            ownerUserId: resourceToUpdate.createdById,
          })

          return db
            .update(contentResource)
            .set(migratedResource)
            .where(eq(contentResource.id, updatedVideoResource._id))
        })
      }
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
