import { z } from 'zod'

export const VIDEO_SRT_READY_EVENT = 'video/srt-ready'

export type VideoSrtReady = {
  name: typeof VIDEO_SRT_READY_EVENT
  data: VideoSrtReadyEvent
}

export const VideoSrtReadyEventSchema = z.object({
  videoResourceId: z.string(),
  srt: z.string(),
})

export type VideoSrtReadyEvent = z.infer<typeof VideoSrtReadyEventSchema>
