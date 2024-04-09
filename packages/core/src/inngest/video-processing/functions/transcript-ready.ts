import { decompress } from 'shrink-string'

import {
	DeepgramResultsSchema,
	srtFromTranscriptResult,
	transcriptAsParagraphsWithTimestamps,
	wordLevelSrtFromTranscriptResult,
} from '../../../providers/deepgram'
import {
	CoreInngestFunctionInput,
	CoreInngestHandler,
	CoreInngestTrigger,
} from '../../create-inngest-middleware'
import { VIDEO_SRT_READY_EVENT } from '../events/event-video-srt-ready-to-asset'
import { VIDEO_TRANSCRIPT_READY_EVENT } from '../events/event-video-transcript-ready'

const transcriptReadyConfig = {
	id: `transcript-ready-event`,
	name: 'Transcript Ready',
}
const transcriptReadyTrigger: CoreInngestTrigger = {
	event: VIDEO_TRANSCRIPT_READY_EVENT,
}
const transcriptReadyHandler: CoreInngestHandler = async ({
	event,
	step,
	partyProvider,
	db,
}: CoreInngestFunctionInput) => {
	const videoResourceId = event.data.videoResourceId
	if (!videoResourceId) {
		throw new Error('video resource id is required')
	}

	const { srt, wordLevelSrt, transcript } = await step.run(
		'decompress results',
		async () => {
			const results = DeepgramResultsSchema.parse(
				await decompress(event.data.results),
			)
			const srt = srtFromTranscriptResult(results)
			const wordLevelSrt = wordLevelSrtFromTranscriptResult(results)
			const transcript = transcriptAsParagraphsWithTimestamps(results)
			return { srt, wordLevelSrt, transcript }
		},
	)

	await step.run('update the video resource in the database', async () => {
		await db.updateContentResourceFields({
			id: videoResourceId,
			fields: {
				transcript,
				srt,
				wordLevelSrt,
			},
		})
	})

	if (srt && wordLevelSrt && videoResourceId) {
		await step.sendEvent('announce that srt is ready', {
			name: VIDEO_SRT_READY_EVENT,
			data: {
				videoResourceId: videoResourceId,
				srt,
			},
		})
	}

	await step.run('send the transcript to the party', async () => {
		return await partyProvider.broadcastMessage({
			body: {
				body: transcript,
				requestId: videoResourceId,
				name: 'transcript.ready',
			},
			roomId: videoResourceId,
		})
	})

	return event.data.results
}

export const transcriptReady = {
	config: transcriptReadyConfig,
	trigger: transcriptReadyTrigger,
	handler: transcriptReadyHandler,
}
