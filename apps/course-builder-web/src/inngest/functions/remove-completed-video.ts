import { utapi } from '@/app/api/uploadthing/core'
import { VIDEO_STATUS_CHECK_EVENT } from '@/inngest/events/video-status-check'
import { inngest } from '@/inngest/inngest.server'
import { getVideoResource } from '@/lib/video-resource-query'
import { NonRetriableError } from 'inngest'

export const removeCompletedVideo = inngest.createFunction(
  { id: `remove-video-after-completed`, name: 'Remove Uploadthing Video' },
  { event: VIDEO_STATUS_CHECK_EVENT },
  async ({ event, step }) => {
    const videoResource = await step.run('Load Video Resource', async () => {
      return await getVideoResource(event.data.videoResourceId)
    })

    if (!videoResource) {
      throw new NonRetriableError('Video Resource not found')
    }

    const finishedStates = ['ready', 'errored']

    if (finishedStates.includes(videoResource.state)) {
      await step.sleep('wait a few just to be sure', '30m')
      await step.run('delete file from uploadthing', async () => {
        return utapi.deleteFiles(event.data.fileKey as string)
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
