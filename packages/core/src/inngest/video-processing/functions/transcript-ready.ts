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
	partyKitRootUrl,
	db,
}: CoreInngestFunctionInput) => {
	const videoResourceId = event.data.videoResourceId
	if (!videoResourceId) {
		throw new Error('video resource id is required')
	}

	const transcript = event.data.transcript
	const srt = event.data.srt
	const wordLevelSrt = event.data.wordLevelSrt

	await step.run('update the video resource in the database', async () => {
		db.updateContentResourceFields({
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
				moduleSlug: event.data.moduleSlug,
				srt,
				wordLevelSrt,
			},
		})
	}

	await step.run('send the transcript to the party', async () => {
		await fetch(`${partyKitRootUrl}/party/${videoResourceId}`, {
			method: 'POST',
			body: JSON.stringify({
				body: transcript,
				requestId: videoResourceId,
				name: 'transcript.ready',
			}),
		}).catch((e) => {
			console.error(e)
		})
	})

	return { srt, wordLevelSrt, transcript }
}

export const transcriptReady = {
	config: transcriptReadyConfig,
	trigger: transcriptReadyTrigger,
	handler: transcriptReadyHandler,
}
