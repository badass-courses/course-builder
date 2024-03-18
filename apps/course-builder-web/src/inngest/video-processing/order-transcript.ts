import { transcriptProvider } from '@/coursebuilder/course-builder-config'
import { inngest } from '@/inngest/inngest.server'
import { NonRetriableError } from 'inngest'

import { VIDEO_RESOURCE_CREATED_EVENT } from '@coursebuilder/core/inngest/video-processing/events'

export const orderTranscript = inngest.createFunction(
  { id: `order-transcript`, name: 'Order Transcript from Deepgram' },
  { event: VIDEO_RESOURCE_CREATED_EVENT },
  async ({ event, step, db }) => {
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
  },
)
