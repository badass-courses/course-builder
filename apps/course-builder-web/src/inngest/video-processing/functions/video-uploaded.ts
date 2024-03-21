import { inngest } from '@/inngest/inngest.server'

import {
  VIDEO_RESOURCE_CREATED_EVENT,
  VIDEO_STATUS_CHECK_EVENT,
  VIDEO_UPLOADED_EVENT,
} from '@coursebuilder/core/inngest/video-processing/events'
import { createMuxAsset } from '@coursebuilder/core/lib/mux'

export const videoUploaded = inngest.createFunction(
  {
    id: `video-uploaded`,
    name: 'Video Uploaded',
    rateLimit: {
      key: 'event.user.id',
      limit: 5,
      period: '10m',
    },
  },
  { event: VIDEO_UPLOADED_EVENT },
  async ({ event, step, db, partyKitRootUrl }) => {
    if (!event.user.id) {
      throw new Error('No user id for video uploaded event')
    }

    const muxAsset = await step.run('create the mux asset', async () => {
      return createMuxAsset({
        url: event.data.originalMediaUrl,
        passthrough: event.data.resourceId || event.data.fileName,
      })
    })

    await step.run('create the video resource in database', async () => {
      const playbackId = muxAsset.playback_ids.filter(
        (playbackId) => playbackId.policy === 'public',
      )[0]?.id

      if (!playbackId) {
        throw new Error('No public playback id found')
      }

      return db.createContentResource({
        id: event.data.fileName,
        type: 'videoResource',
        fields: {
          state: 'processing',
          originalMediaUrl: event.data.originalMediaUrl,
          muxAssetId: muxAsset.id,
          muxPlaybackId: playbackId,
        },
        createdById: event.user.id,
      })
    })

    const videoResource = await step.run(
      'get the video resource from database',
      async () => {
        return db.getVideoResource(event.data.fileName)
      },
    )

    if (!videoResource) {
      throw new Error('Failed to create video resource')
    }

    await step.run('announce video resource created', async () => {
      await fetch(`${partyKitRootUrl}/party/${videoResource._id}`, {
        method: 'POST',
        body: JSON.stringify({
          body: videoResource,
          requestId: event.data.fileName,
          name: 'videoResource.created',
        }),
      }).catch((e) => {
        console.error(e)
      })
    })

    if (videoResource && videoResource._id) {
      await step.sendEvent('announce new video resource', {
        name: VIDEO_RESOURCE_CREATED_EVENT,
        data: {
          moduleSlug: event.data.moduleSlug,
          originalMediaUrl: event.data.originalMediaUrl,
          videoResourceId: videoResource._id,
        },
      })

      if (event.data.fileKey) {
        await step.sendEvent('remove video from uploadthing when done', {
          name: VIDEO_STATUS_CHECK_EVENT,
          data: {
            fileKey: event.data.fileKey,
            videoResourceId: videoResource._id,
          },
        })
      }
    }

    return { data: event.data, videoResource, muxAsset }
  },
)
