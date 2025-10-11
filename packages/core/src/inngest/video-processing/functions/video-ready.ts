import {
	CoreInngestFunctionInput,
	CoreInngestHandler,
	CoreInngestTrigger,
} from '../../create-inngest-middleware'
import { MUX_WEBHOOK_EVENT } from '../events/event-video-mux-webhook'
import { videoChannel } from '../realtime'

const videoReadyConfig = {
	id: `mux-video-asset-ready`,
	name: 'Mux Video Asset Ready',
}
const videoReadyTrigger: CoreInngestTrigger = {
	event: MUX_WEBHOOK_EVENT,
	if: 'event.data.muxWebhookEvent.type == "video.asset.ready"',
}
const realtimeEnabled =
	process.env.NEXT_PUBLIC_ENABLE_REALTIME_VIDEO_UPLOAD === 'true'

const videoReadyHandler: CoreInngestHandler = async ({
	event,
	step,
	db,
	partyProvider,
	publish,
}: CoreInngestFunctionInput) => {
	const videoResource = await step.run('Load Video Resource', async () => {
		return db.getVideoResource(event.data.muxWebhookEvent.data.passthrough)
	})

	if (videoResource) {
		await step.run('update the video resource in database', async () => {
			return db.updateContentResourceFields({
				id: videoResource.id as string,
				fields: {
					state: 'ready',
				},
			})
		})
	}

	await step.run('announce asset ready', async () => {
		const roomId = event.data.muxWebhookEvent.data.passthrough
		const payload = {
			name: 'video.asset.ready' as const,
			body: videoResource?.muxPlaybackId,
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

export const videoReady = {
	config: videoReadyConfig,
	trigger: videoReadyTrigger,
	handler: videoReadyHandler,
}
