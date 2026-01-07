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
	retries: 3, // Limit Inngest retries for database errors
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
		const maxRetries = 30 // 30 days max wait time (checking once per day)

		// Check if video has been stuck in processing for too long (30 days)
		const videoAge = videoResource.createdAt
			? Date.now() - new Date(videoResource.createdAt).getTime()
			: 0
		const maxAge = 30 * 24 * 60 * 60 * 1000 // 30 days in milliseconds

		if (retryCount >= maxRetries || videoAge > maxAge) {
			// Fail if we've exceeded retries or video is too old
			const ageDays =
				videoAge > 0 ? Math.round(videoAge / (24 * 60 * 60 * 1000)) : 0
			throw new NonRetriableError(
				`Video processing timeout after ${retryCount} days${ageDays > 0 ? ` or ${ageDays} days old` : ''}. ` +
					'This likely means Mux webhooks are not configured or video processing failed.',
			)
		}

		// Check once per day instead of frequent retries
		await step.sleep('wait 24 hours before checking again', '24h')
		await step.sendEvent('check video status daily', {
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
