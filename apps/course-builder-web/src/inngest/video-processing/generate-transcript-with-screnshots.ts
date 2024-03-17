import { env } from '@/env.mjs'
import { inngest } from '@/inngest/inngest.server'
import { VIDEO_SRT_READY_EVENT } from '@/inngest/video-processing/events/video-srt-ready-to-asset'
import { getVideoResource, updateVideoTranscriptWithScreenshots } from '@/lib/video-resource-query'
import { mergeSrtWithScreenshots } from '@/transcript-processing/merge-srt-with-screenshots'
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
      return getVideoResource(videoResourceId)
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
      return updateVideoTranscriptWithScreenshots({
        videoResourceId,
        transcriptWithScreenshots,
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
