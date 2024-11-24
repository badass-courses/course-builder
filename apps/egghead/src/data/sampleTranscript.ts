import { transformTranscriptData } from '@/utils/transcript-data-transform'

const rawData = {
	deepgramResults: {
		/* ... existing data ... */
	},
}

export const sampleData = transformTranscriptData(rawData)
