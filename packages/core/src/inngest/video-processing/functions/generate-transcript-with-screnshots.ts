import { NonRetriableError } from 'inngest'

import {
	CoreInngestFunctionInput,
	CoreInngestHandler,
	CoreInngestTrigger,
} from '../../create-inngest-middleware'
import { VIDEO_SRT_READY_EVENT } from '../events/event-video-srt-ready-to-asset'
import { videoChannel } from '../realtime'
import { mergeSrtWithScreenshots } from '../utils'

const realtimeEnabled =
	process.env.NEXT_PUBLIC_ENABLE_REALTIME_VIDEO_UPLOAD === 'true'

export const generateTranscriptWithScreenshotsConfig = {
	id: `generate-transcript-with-screenshots`,
	name: 'Generate Transcript with Screenshots',
}
export const generateTranscriptWithScreenshotsTrigger: CoreInngestTrigger = {
	event: VIDEO_SRT_READY_EVENT,
}

export const generateTranscriptWithScreenshotsHandler: CoreInngestHandler =
	async ({
		event,
		step,
		db,
		partyProvider,
		publish,
	}: CoreInngestFunctionInput) => {
		const videoResourceId = event.data.videoResourceId

		if (!videoResourceId) {
			throw new Error('video resource id is required')
		}

		const videoResource = await step.run(
			'get the video resource from Sanity',
			async () => {
				return db.getVideoResource(videoResourceId)
			},
		)

		if (!videoResource) {
			throw new NonRetriableError(
				`Video resource not found for id (${event.data.videoResourceId})`,
			)
		}

		const { transcriptWithScreenshots } = await step.run(
			'generate transcript with screenshots',
			async () => {
				if (!videoResource.muxPlaybackId) {
					throw new Error(
						`Video resource (${event.data.videoResourceId}) does not have a muxPlaybackId`,
					)
				}
				if (!event.data.srt) {
					throw new Error(
						`Video resource (${event.data.videoResourceId}) does not have an srt`,
					)
				}
				return await mergeSrtWithScreenshots(
					event.data.srt,
					videoResource.muxPlaybackId,
				)
			},
		)

		await step.run('update the video resource in the database', async () => {
			return db.updateContentResourceFields({
				id: videoResourceId,
				fields: { transcriptWithScreenshots },
			})
		})

		await step.run('send the transcript update', async () => {
			const roomId = event.data.videoResourceId
			const payload = {
				name: 'transcriptWithScreenshots.ready' as const,
				body: transcriptWithScreenshots,
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

		return { transcriptWithScreenshots }
	}

export const generateTranscriptWithScreenshots = {
	config: generateTranscriptWithScreenshotsConfig,
	trigger: generateTranscriptWithScreenshotsTrigger,
	handler: generateTranscriptWithScreenshotsHandler,
}
