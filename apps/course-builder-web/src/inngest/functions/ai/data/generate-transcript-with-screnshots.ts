import { revalidateTag } from 'next/cache'
import { db } from '@/db'
import { contentResource } from '@/db/schema'
import { MUX_SRT_READY_EVENT } from '@/inngest/events/mux-add-srt-to-asset'
import { inngest } from '@/inngest/inngest.server'
import { convertToMigratedVideoResource, VideoResource, VideoResourceSchema } from '@/lib/video-resource'
import { getVideoResource } from '@/lib/video-resource-query'
import { sanityMutation, sanityQuery } from '@/server/sanity.server'
import { mergeSrtWithScreenshots } from '@/transcript-processing/merge-srt-with-screenshots'
import { eq, sql } from 'drizzle-orm'
import { NonRetriableError } from 'inngest'

export const generateTranscriptWithScreenshots = inngest.createFunction(
  {
    id: `generate-transcript-with-screenshots`,
    name: 'Generate Transcript with Screenshots',
  },
  {
    event: MUX_SRT_READY_EVENT,
  },
  async ({ event, step }) => {
    const videoResource = await step.run('get the video resource from Sanity', async () => {
      return sanityQuery<VideoResource | null>(`*[_id == "${event.data.videoResourceId}"][0]`)
    })

    if (!videoResource) {
      throw new NonRetriableError(`Video resource not found for id (${event.data.videoResourceId})`)
    }

    const { transcriptWithScreenshots } = await step.run('generate transcript with screenshots', async () => {
      if (!videoResource.muxPlaybackId) {
        throw new Error(`Video resource (${event.data.videoResourceId}) does not have a muxPlaybackId`)
      }
      if (!videoResource.srt) {
        throw new Error(`Video resource (${event.data.videoResourceId}) does not have an srt`)
      }
      return await mergeSrtWithScreenshots(videoResource.srt, videoResource.muxPlaybackId)
    })

    await step.run('update the video resource in Sanity', async () => {
      await sanityMutation([
        {
          patch: {
            id: videoResource._id,
            set: {
              transcriptWithScreenshots,
            },
          },
        },
      ])

      revalidateTag(videoResource._id)
    })

    const updatedVideoResource = await step.run('update the video resource in the database', async () => {
      return sanityQuery<VideoResource | null>(`*[_id == "${event.data.videoResourceId}"][0]`)
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

        return db.update(contentResource).set(migratedResource).where(eq(contentResource.id, updatedVideoResource._id))
      })
    }

    return { transcriptWithScreenshots }
  },
)
