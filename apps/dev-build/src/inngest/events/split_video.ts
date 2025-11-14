export const REQUEST_VIDEO_SPLIT_POINTS = 'split_video/request_split_points'

export type RequestVideoSplitPoints = {
	name: typeof REQUEST_VIDEO_SPLIT_POINTS
	data: {
		resource_id: string
		transcript: string
	}
}
