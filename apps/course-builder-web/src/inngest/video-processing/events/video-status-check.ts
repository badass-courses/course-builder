import { z } from 'zod'

export const VIDEO_STATUS_CHECK_EVENT = 'video/status-check'

export type VideoStatusCheck = {
  name: typeof VIDEO_STATUS_CHECK_EVENT
  data: VideoStatusCheckEvent
}

export const VideoStatusCheckEventSchema = z.object({
  videoResourceId: z.string(),
  fileKey: z.string(),
})

export type VideoStatusCheckEvent = z.infer<typeof VideoStatusCheckEventSchema>
