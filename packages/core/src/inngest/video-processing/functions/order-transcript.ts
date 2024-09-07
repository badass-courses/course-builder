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

	const deepgram = await step.run('Order Transcript [Deepgram]', async () => {
		return await transcriptProvider.initiateTranscription({
			mediaUrl: event.data.originalMediaUrl,
			resourceId: event.data.videoResourceId,
		})
	})

	return { deepgram, videoResource }
}

export const orderTranscript = {
	config: orderTranscriptConfig,
	trigger: orderTranscriptTrigger,
	handler: orderTranscriptHandler,
}
