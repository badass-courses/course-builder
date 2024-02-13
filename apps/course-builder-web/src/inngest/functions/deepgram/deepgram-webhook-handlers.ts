import { env } from '@/env.mjs'
import { DEEPGRAM_WEBHOOK_EVENT } from '@/inngest/events/deepgram-webhook'
import { MUX_SRT_READY_EVENT } from '@/inngest/events/mux-add-srt-to-asset'
import { inngest } from '@/inngest/inngest.server'
import { VideoResourceSchema } from '@/lib/video-resource'
import { sanityMutation, sanityQuery } from '@/server/sanity.server'
import {
  srtFromTranscriptResult,
  transcriptAsParagraphsWithTimestamps,
  wordLevelSrtFromTranscriptResult,
} from '@/transcript-processing/deepgram-results-processor'

export const deepgramTranscriptReady = inngest.createFunction(
  { id: `deepgram-transcript-ready-event`, name: 'Deepgram Transcript Ready' },
  {
    event: DEEPGRAM_WEBHOOK_EVENT,
  },
  async ({ event, step }) => {
    const srt = srtFromTranscriptResult(event.data.results)
    const wordLevelSrt = wordLevelSrtFromTranscriptResult(event.data.results)
    const transcript = transcriptAsParagraphsWithTimestamps(event.data.results)
    const videoResource = await step.run('get the video resource from Sanity', async () => {
      const resourceTemp = VideoResourceSchema.safeParse(
        await sanityQuery(`*[_type == "videoResource" && _id == "${event.data.videoResourceId}"][0]`),
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
                srt,
                wordLevelSrt,
                transcript,
              },
            },
          },
        ])
      })

      await step.sendEvent('announce that srt is ready', {
        name: MUX_SRT_READY_EVENT,
        data: {
          videoResourceId: videoResource._id,
          moduleSlug: event.data.moduleSlug,
          srt,
          wordLevelSrt,
        },
      })
    }

    await step.run('send the transcript to the party', async () => {
      await fetch(`${env.NEXT_PUBLIC_PARTY_KIT_URL}/party/${event.data.videoResourceId}`, {
        method: 'POST',
        body: JSON.stringify({
          body: transcript,
          requestId: event.data.videoResourceId,
          name: 'transcript.ready',
        }),
      }).catch((e) => {
        console.error(e)
      })
    })

    return { srt, wordLevelSrt, transcript }
  },
)
