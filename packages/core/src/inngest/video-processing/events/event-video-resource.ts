import { z } from 'zod'

export const VIDEO_RESOURCE_CREATED_EVENT = 'video-resource/created'

export type VideoResourceCreated = {
	name: typeof VIDEO_RESOURCE_CREATED_EVENT
	data: VideoResourceCreatedEvent
}

export const VideoResourceCreatedEventSchema = z.object({
	videoResourceId: z.string(),
	originalMediaUrl: z.string(),
	moduleSlug: z.string().optional(),
	createdById: z.string().optional(), // Optional: pass through for webhook handler
})

export type VideoResourceCreatedEvent = z.infer<
	typeof VideoResourceCreatedEventSchema
>
