import { z } from 'zod'

import { DeepgramResultsSchema } from '../../../providers/deepgram'

export const VIDEO_TRANSCRIPT_READY_EVENT = 'video/transcript-ready-event'

export type EventVideoTranscriptReady = {
	name: typeof VIDEO_TRANSCRIPT_READY_EVENT
	data: VideoTranscriptReadyEvent
}

export const VideoTranscriptReadyEventSchema = z.object({
	videoResourceId: z.string().nullable(),
})

export type VideoTranscriptReadyEvent = z.infer<
	typeof VideoTranscriptReadyEventSchema
>
