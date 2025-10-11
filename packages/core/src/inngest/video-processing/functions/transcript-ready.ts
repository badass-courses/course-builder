import {
	CoreInngestFunctionInput,
	CoreInngestHandler,
	CoreInngestTrigger,
} from '../../create-inngest-middleware'
import { VIDEO_TRANSCRIPT_READY_EVENT } from '../events/event-video-transcript-ready'
import { videoChannel } from '../realtime'

const transcriptReadyConfig = {
	id: `transcript-ready-event`,
	name: 'Transcript Ready',
}
const transcriptReadyTrigger: CoreInngestTrigger = {
	event: VIDEO_TRANSCRIPT_READY_EVENT,
}
const realtimeEnabled =
	process.env.NEXT_PUBLIC_ENABLE_REALTIME_VIDEO_UPLOAD === 'true'

const transcriptReadyHandler: CoreInngestHandler = async ({
	event,
	step,
	partyProvider,
	db,
	publish,
}: CoreInngestFunctionInput) => {
	const videoResourceId = event.data.videoResourceId
	if (!videoResourceId) {
		throw new Error('video resource id is required')
	}

	const videoResource = await step.run('get video resource', async () => {
		return db.getVideoResource(videoResourceId)
	})

	await step.run('send the transcript update', async () => {
		const payload = {
			name: 'transcript.ready' as const,
			body: videoResource?.transcript,
			requestId: videoResourceId,
		}
		if (realtimeEnabled && publish) {
			await publish(videoChannel(videoResourceId).status(payload))
		}

		if (!realtimeEnabled || !publish) {
			await partyProvider.broadcastMessage({
				body: {
					body: payload.body,
					requestId: payload.requestId,
					name: payload.name,
				},
				roomId: videoResourceId,
			})
		}
	})

	return event.data.results
}

export const transcriptReady = {
	config: transcriptReadyConfig,
	trigger: transcriptReadyTrigger,
	handler: transcriptReadyHandler,
}
