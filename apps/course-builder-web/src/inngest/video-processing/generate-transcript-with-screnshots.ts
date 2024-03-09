import { db } from '@/db'
import { contentResource } from '@/db/schema'
import { env } from '@/env.mjs'
import { inngest } from '@/inngest/inngest.server'
import { VIDEO_SRT_READY_EVENT } from '@/inngest/video-processing/events/video-srt-ready-to-asset'
import { VideoResourceSchema } from '@/lib/video-resource'
import { mergeSrtWithScreenshots } from '@/transcript-processing/merge-srt-with-screenshots'
import { sql } from 'drizzle-orm'
import { NonRetriableError } from 'inngest'

export const generateTranscriptWithScreenshots = inngest.createFunction(
  {
    id: `generate-transcript-with-screenshots`,
    name: 'Generate Transcript with Screenshots',
  },
  {
    event: VIDEO_SRT_READY_EVENT,
  },
  async ({ event, step }) => {
    const videoResourceId = event.data.videoResourceId

    if (!videoResourceId) {
      throw new Error('video resource id is required')
    }

    const videoResource = await step.run('get the video resource from Sanity', async () => {
      const query = sql`
        SELECT
          id as _id,
          CAST(updatedAt AS DATETIME) as _updatedAt,
          CAST(createdAt AS DATETIME) as _createdAt,
          JSON_EXTRACT (${contentResource.fields}, "$.state") AS state,
          JSON_EXTRACT (${contentResource.fields}, "$.duration") AS duration,
          JSON_EXTRACT (${contentResource.fields}, "$.muxPlaybackId") AS muxPlaybackId,
          JSON_EXTRACT (${contentResource.fields}, "$.muxAssetId") AS muxAssetId,
          JSON_EXTRACT (${contentResource.fields}, "$.srt") AS srt
        FROM
          ${contentResource}
        WHERE
          type = 'videoResource'
          AND (id = ${videoResourceId});
        `

      return db
        .execute(query)
        .then((result) => {
          const parsed = VideoResourceSchema.safeParse(result.rows[0])
          return parsed.success ? parsed.data : null
        })
        .catch((error) => {
          console.error(error)
          throw error
        })
    })

    if (!videoResource) {
      throw new NonRetriableError(`Video resource not found for id (${event.data.videoResourceId})`)
    }

    const { transcriptWithScreenshots } = await step.run('generate transcript with screenshots', async () => {
      if (!videoResource.muxPlaybackId) {
        throw new Error(`Video resource (${event.data.videoResourceId}) does not have a muxPlaybackId`)
      }
      if (!event.data.srt) {
        throw new Error(`Video resource (${event.data.videoResourceId}) does not have an srt`)
      }
      return await mergeSrtWithScreenshots(event.data.srt, videoResource.muxPlaybackId)
    })

    await step.run('update the video resource in the database', async () => {
      const query = sql`
        UPDATE ${contentResource}
        SET
          ${contentResource.fields} = JSON_SET(
            ${contentResource.fields}, '$.transcriptWithScreenshots', ${transcriptWithScreenshots})
        WHERE
          id = ${videoResourceId};
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

    await step.run('send the transcript to the party', async () => {
      await fetch(`${env.NEXT_PUBLIC_PARTY_KIT_URL}/party/${event.data.videoResourceId}`, {
        method: 'POST',
        body: JSON.stringify({
          body: transcriptWithScreenshots,
          requestId: event.data.videoResourceId,
          name: 'transcriptWithScreenshots.ready',
        }),
      }).catch((e) => {
        console.error(e)
      })
    })

    return { transcriptWithScreenshots }
  },
)
