import { channel, topic } from '@inngest/realtime'
import { z } from 'zod'

const statusPayloadSchema = z.object({
	name: z.enum([
		'videoResource.created',
		'video.asset.ready',
		'video.asset.errored',
		'transcript.ready',
		'transcriptWithScreenshots.ready',
	]),
	body: z.any(),
	requestId: z.string(),
})

export type VideoStatusPayload = z.infer<typeof statusPayloadSchema>

export const videoChannel = channel(
	(videoId: string) => `video:${videoId}`,
).addTopic(topic('status').schema(statusPayloadSchema))
