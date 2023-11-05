import {env} from "@/env.mjs";
import z from 'zod'
import {inngest} from "@/inngest/inngest.server";
import {TRANSCRIPT_READY_EVENT, TRANSCRIPT_REQUESTED_EVENT} from "@/inngest/events/transcript-requested";
import {MUX_SRT_READY_EVENT} from "@/inngest/events/mux-add-srt-to-asset"
import {sanityMutation, sanityQuery} from "@/server/sanity.server";

const deepgramUrl = `https://api.deepgram.com/v1/listen`

export const VideoResourceSchema = z.object({
  _id: z.string().optional(),
  muxPlaybackId: z.string().optional(),
  muxAssetId: z.string().optional(),
  transcript: z.string().optional(),
  srt: z.string().optional(),
})

export type VideoResource = z.infer<typeof VideoResourceSchema>

export const transcriptRequested = inngest.createFunction(
  {id: `transcript-requested`, name: 'Transcript Requested'},
  {event: TRANSCRIPT_REQUESTED_EVENT},
  async ({event, step}) => {

    const deepgramResponse = await step.run('send the media to Deepgram', async () => {
      const utteranceSpiltThreshold = 0.5

      const callbackParams = new URLSearchParams({
        videoResourceId: event.data.videoResourceId,
        ...(event.data.moduleSlug && {moduleSlug: event.data.moduleSlug})
      })

      // just weird URL differences between dev and prod
      const callbackBase = env.NODE_ENV === 'production' ? env.UPLOADTHING_URL : env.NEXTAUTH_URL

      const deepgramParams = new URLSearchParams({
        model: 'whisper-large',
        punctuate: 'true',
        paragraphs: 'true',
        utterances: 'true',
        utt_split: String(utteranceSpiltThreshold),
        callback: `${callbackBase}/api/deepgram/webhook?${callbackParams.toString()}`,
      })

      const deepgramResponse = await fetch(`${deepgramUrl}?${deepgramParams.toString()}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Token ${env.DEEPGRAM_API_KEY}`,
        },
        body: JSON.stringify({
          url: event.data.mediaUrl,
        }),
      })

      return {deepgramResponse: await deepgramResponse.json(), postedUrl: `${deepgramUrl}?${deepgramParams.toString()}`}
    })

    return {
      ...event.data,
      ...deepgramResponse
    }
  }
)

export const transcriptReady = inngest.createFunction(
  {id: `transcript-ready`, name: 'Transcript Ready'},
  {event: TRANSCRIPT_READY_EVENT},
  async ({event, step}) => {
    const videoResource = await step.run('get the video resource from Sanity', async () => {
      const resourceTemp = VideoResourceSchema.safeParse(await sanityQuery(`*[_type == "videoResource" && _id == "${event.data.videoResourceId}"][0]`))
      return resourceTemp.success ? resourceTemp.data : null
    })

    if (videoResource) {
      await step.run('update the video resource in Sanity', async () => {
        return await sanityMutation( [
          {
            "patch": {
              "id": videoResource._id,
              "set": {
                "srt": event.data.srt,
                "transcript": event.data.transcript,
                "state": `ready`,
              },
            }
          }
        ])
      })

      await step.sendEvent('announce that srt is ready', {
        name: MUX_SRT_READY_EVENT,
        data: {
          videoResourceId: videoResource._id as string,
          moduleSlug: event.data.moduleSlug,
          srt: event.data.srt,
        }
      })
    }

    await step.run('send the transcript to the party', async () => {
      await fetch(`${env.NEXT_PUBLIC_PARTY_KIT_URL}/party/${env.NEXT_PUBLIC_PARTYKIT_ROOM_NAME}`, {
        method: 'POST',
        body: JSON.stringify({
          body: event.data.transcript,
          requestId: event.data.videoResourceId,
          name: 'transcript.ready',
        }),
      }).catch((e) => {
        console.error(e);
      })
    })

    return event.data
  }
)




