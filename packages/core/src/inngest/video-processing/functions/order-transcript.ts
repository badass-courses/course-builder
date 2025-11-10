import { NonRetriableError } from 'inngest'

import {
	CoreInngestFunctionInput,
	CoreInngestHandler,
	CoreInngestTrigger,
} from '../../create-inngest-middleware'
import { VIDEO_RESOURCE_CREATED_EVENT } from '../events/event-video-resource'

export const orderTranscriptConfig = {
	id: `order-transcript`,
	name: 'Order Transcript from Deepgram',
}
export const orderTranscriptTrigger: CoreInngestTrigger = {
	event: VIDEO_RESOURCE_CREATED_EVENT,
}
export const orderTranscriptHandler: CoreInngestHandler = async ({
	event,
	step,
	db,
	transcriptProvider,
}: CoreInngestFunctionInput) => {
	const videoResource = await step.run('Load Video Resource', async () => {
		return db.getVideoResource(event.data.videoResourceId)
	})

	if (!videoResource) {
		throw new NonRetriableError('Video Resource not found')
	}

	// Create raw-transcript resource before ordering transcript
	// This matches the normal flow - raw-transcript is created when transcript is ordered
	const rawTranscriptId = `raw-transcript-${videoResource.id}`
	await step.run('Create raw-transcript resource', async () => {
		const existingRawTranscript = await db.getContentResource(rawTranscriptId)

		if (!existingRawTranscript) {
			await db.createContentResource({
				id: rawTranscriptId,
				type: 'raw-transcript',
				fields: {
					// Empty initially, will be filled by Deepgram webhook
					deepgramResults: null,
				},
				createdById: event.data.createdById || videoResource.createdById,
			})

			// Link raw-transcript to video resource
			await db.addResourceToResource({
				childResourceId: rawTranscriptId,
				parentResourceId: videoResource.id,
			})
		}
	})

	const deepgram = await step.run('Order Transcript [Deepgram]', async () => {
		return await transcriptProvider.initiateTranscription({
			mediaUrl: event.data.originalMediaUrl,
			resourceId: event.data.videoResourceId,
			createdById: event.data.createdById, // Pass through for webhook handler
		})
	})

	return { deepgram, videoResource }
}

export const orderTranscript = {
	config: orderTranscriptConfig,
	trigger: orderTranscriptTrigger,
	handler: orderTranscriptHandler,
}
