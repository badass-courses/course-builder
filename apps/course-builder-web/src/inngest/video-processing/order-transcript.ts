import { env } from '@/env.mjs'
import { inngest } from '@/inngest/inngest.server'
import { VIDEO_RESOURCE_CREATED_EVENT } from '@/inngest/video-processing/events/video-resource'
import { getVideoResource } from '@/lib/video-resource-query'
import { NonRetriableError } from 'inngest'

import Deepgram from '@coursebuilder/core/providers/deepgram'

const callbackBase = env.NODE_ENV === 'production' ? env.UPLOADTHING_URL : env.NEXT_PUBLIC_URL
const deepgramService = Deepgram({
  apiKey: env.DEEPGRAM_API_KEY,
  callbackUrl: `${callbackBase}/api/deepgram/webhook`,
})

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
      return await deepgramService.initiateTranscription({
        mediaUrl: event.data.originalMediaUrl,
        resourceId: event.data.videoResourceId,
      })
    })

    return { deepgram, videoResource }
  },
)
