import { NonRetriableError } from 'inngest'

import {
	CoreInngestFunctionInput,
	CoreInngestHandler,
	CoreInngestTrigger,
} from '../../create-inngest-middleware'
import { VIDEO_STATUS_CHECK_EVENT } from '../events/event-video-status-check'

const removeCompletedVideoConfig = {
	id: `remove-video-after-completed`,
	name: 'Remove Uploadthing Video',
}
const removeCompletedVideoTrigger: CoreInngestTrigger = {
	event: VIDEO_STATUS_CHECK_EVENT,
}
const removeCompletedVideoHandler: CoreInngestHandler = async ({
	event,
	step,
	db,
	mediaUploadProvider,
}: CoreInngestFunctionInput) => {
	const videoResource = await step.run('Load Video Resource', async () => {
		try {
			return await db.getVideoResource(event.data.videoResourceId)
		} catch (error) {
			// Log database connection issues for debugging
			console.error('Database error in remove-completed-video:', {
				error: error instanceof Error ? error.message : 'Unknown error',
				videoResourceId: event.data.videoResourceId,
				retryCount: event.data.retryCount || 0,
				timestamp: new Date().toISOString(),
			})

			// If it's a database auth error, let Inngest retry automatically
			if (error instanceof Error && error.message.includes('Unauthorized')) {
				throw error // This will trigger Inngest's built-in retry mechanism
			}
			throw error
		}
	})

	if (!videoResource) {
		throw new NonRetriableError('Video Resource not found')
	}

	const finishedStates = ['ready', 'errored']

	if (finishedStates.includes(videoResource.state)) {
		await step.sleep('wait a few just to be sure', '30m')
		await step.run('delete file from uploadthing', async () => {
			return mediaUploadProvider.deleteFiles(event.data.fileKey as string)
		})
	} else {
		// Track retry count to prevent infinite loops when webhooks aren't configured
		const retryCount = (event.data.retryCount || 0) as number
		const maxRetries = 24 // 24 * 5min = 2 hours max wait time

		if (retryCount >= maxRetries) {
			throw new NonRetriableError(
				`Video processing timeout after ${maxRetries} retries (${maxRetries * 5} minutes). ` +
					'This likely means Mux webhooks are not configured or video processing failed.',
			)
		}

		await step.sleep('wait for video to be ready', '5m')
		await step.sendEvent('check video status', {
			name: VIDEO_STATUS_CHECK_EVENT,
			data: {
				...event.data,
				retryCount: retryCount + 1,
			},
		})
	}

	return videoResource
}

export const removeCompletedVideo = {
	config: removeCompletedVideoConfig,
	trigger: removeCompletedVideoTrigger,
	handler: removeCompletedVideoHandler,
}
