import { z } from 'zod'

export const VIDEO_ATTACHED_EVENT = 'video.asset.attached'
export const VIDEO_DETACHED_EVENT = 'video.asset.detached'

export type VideoAttached = {
	name: typeof VIDEO_ATTACHED_EVENT
	data: {
		postId: string
		videoResourceId: string
	}
}

export type VideoDetached = {
	name: typeof VIDEO_DETACHED_EVENT
	data: {
		postId: string
		videoResourceId: string
	}
}

export const VideoAttachedEventSchema = z.object({
	postId: z.string(),
	videoResourceId: z.string(),
})

export const VideoDetachedEventSchema = z.object({
	postId: z.string(),
	videoResourceId: z.string(),
})
