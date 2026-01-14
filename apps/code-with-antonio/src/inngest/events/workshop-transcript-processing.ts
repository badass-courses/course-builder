export const PROCESS_WORKSHOP_TRANSCRIPTS_EVENT = 'workshop/process-transcripts'

export type ProcessWorkshopTranscripts = {
	name: typeof PROCESS_WORKSHOP_TRANSCRIPTS_EVENT
	data: {
		workshopId: string
		delaySeconds?: number
	}
}
