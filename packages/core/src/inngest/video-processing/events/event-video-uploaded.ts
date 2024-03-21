import { z } from 'zod'

export const VIDEO_UPLOADED_EVENT = 'video/video-uploaded'

export type EventVideoUploaded = {
	name: typeof VIDEO_UPLOADED_EVENT
	data: VideoUploadedEvent
}

export const VideoUploadedEventSchema = z.object({
	originalMediaUrl: z.string(),
	fileName: z.string(),
	title: z.string().optional(),
	moduleSlug: z.string().optional(),
	resourceType: z.string().optional(),
	resourceId: z.string().optional(),
	fileKey: z.string().optional(),
})

export type VideoUploadedEvent = z.infer<typeof VideoUploadedEventSchema>
