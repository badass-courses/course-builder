import {
	CoreInngestFunctionInput,
	CoreInngestHandler,
	CoreInngestTrigger,
} from '../../create-inngest-middleware'
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

	const videoResource = await step.run('get video resource', async () => {
		return db.getVideoResource(videoResourceId)
	})

	await step.run('send the transcript to the party', async () => {
		return await partyProvider.broadcastMessage({
			body: {
				body: videoResource?.transcript,
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
