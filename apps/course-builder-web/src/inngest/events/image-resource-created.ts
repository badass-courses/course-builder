import { z } from 'zod'

export const IMAGE_RESOURCE_CREATED_EVENT = 'cloudinary/web-hook-event'

export type ImageResourceCreated = {
	name: typeof IMAGE_RESOURCE_CREATED_EVENT
	data: ImageResourceCreatedEvent
}
export const ImageResourceEventSchema = z.object({
	resourceId: z.string(),
})

export type ImageResourceCreatedEvent = z.infer<typeof ImageResourceEventSchema>
