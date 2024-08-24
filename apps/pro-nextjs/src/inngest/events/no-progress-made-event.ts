export const NO_PROGRESS_MADE_EVENT = 'progress/no.progress.made'

export type NoProgressMade = {
	name: typeof NO_PROGRESS_MADE_EVENT
	data: {
		messageCount: number
	}
}
