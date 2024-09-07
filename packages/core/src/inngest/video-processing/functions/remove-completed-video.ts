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
		return db.getVideoResource(event.data.videoResourceId)
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
		await step.sleep('wait for video to be ready', '5m')
		await step.sendEvent('check video status', {
			name: VIDEO_STATUS_CHECK_EVENT,
			data: event.data,
		})
	}

	return videoResource
}

export const removeCompletedVideo = {
	config: removeCompletedVideoConfig,
	trigger: removeCompletedVideoTrigger,
	handler: removeCompletedVideoHandler,
}
