import {
	CoreInngestFunctionInput,
	CoreInngestHandler,
	CoreInngestTrigger,
} from '../../create-inngest-middleware'
import { MUX_WEBHOOK_EVENT } from '../events/event-video-mux-webhook'
import { videoChannel } from '../realtime'

const videoProcessingErrorConfig = {
	id: `mux-video-asset-error`,
	name: 'Mux Video Asset Errored',
}
const videoProcessingErrorTrigger: CoreInngestTrigger = {
	event: MUX_WEBHOOK_EVENT,
	if: 'event.data.muxWebhookEvent.type == "video.asset.errored"',
}
const realtimeEnabled =
	process.env.NEXT_PUBLIC_ENABLE_REALTIME_VIDEO_UPLOAD === 'true'

const videoProcessingErrorHandler: CoreInngestHandler = async ({
	event,
	step,
	db,
	partyProvider,
	publish,
}: CoreInngestFunctionInput) => {
	const videoResource = await step.run('Load Video Resource', async () => {
		return db.getVideoResource(event.data.muxWebhookEvent.data.passthrough)
	})

	if (!videoResource) {
		throw new Error('Video Resource not found')
	}

	await step.run('update the video resource in Sanity as errored', async () => {
		return db.updateContentResourceFields({
			id: videoResource.id as string,
			fields: {
				state: 'errored',
			},
		})
	})

	await step.run('announce asset errored', async () => {
		const roomId = event.data.muxWebhookEvent.data.passthrough
		const payload = {
			name: 'video.asset.errored' as const,
			body: `Mux Asset Errored: ${event.data.muxWebhookEvent.data.id}`,
			requestId: roomId,
		}
		if (realtimeEnabled && publish) {
			await publish(videoChannel(roomId).status(payload))
		}

		if (!realtimeEnabled || !publish) {
			await partyProvider.broadcastMessage({
				body: {
					body: payload.body,
					requestId: payload.requestId,
					name: payload.name,
				},
				roomId,
			})
		}
	})
	return event.data.muxWebhookEvent.data
}

export const videoProcessingError = {
	config: videoProcessingErrorConfig,
	trigger: videoProcessingErrorTrigger,
	handler: videoProcessingErrorHandler,
}
