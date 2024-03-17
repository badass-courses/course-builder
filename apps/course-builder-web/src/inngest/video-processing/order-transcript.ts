import { inngest } from '@/inngest/inngest.server'
import { VIDEO_RESOURCE_CREATED_EVENT } from '@/inngest/video-processing/events/video-resource'
import { getVideoResource } from '@/lib/video-resource-query'
import { transcriptProvider } from '@/providers/deepgram'
import { NonRetriableError } from 'inngest'

export const orderTranscript = inngest.createFunction(
  { id: `order-transcript`, name: 'Order Transcript from Deepgram' },
  { event: VIDEO_RESOURCE_CREATED_EVENT },
  async ({ event, step }) => {
    const videoResource = await step.run('Load Video Resource', async () => {
      return getVideoResource(event.data.videoResourceId)
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
