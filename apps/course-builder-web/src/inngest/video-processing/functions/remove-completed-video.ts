import { inngest } from '@/inngest/inngest.server'
import { NonRetriableError } from 'inngest'

import { VIDEO_STATUS_CHECK_EVENT } from '@coursebuilder/core/inngest/video-processing/events'

export const removeCompletedVideo = inngest.createFunction(
  { id: `remove-video-after-completed`, name: 'Remove Uploadthing Video' },
  { event: VIDEO_STATUS_CHECK_EVENT },
  async ({ event, step, db, mediaUploadProvider }) => {
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
  },
)
