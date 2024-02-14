import { VIDEO_RESOURCE_CREATED_EVENT } from '@/inngest/events/video-resource'
import { inngest } from '@/inngest/inngest.server'
import { orderDeepgramTranscript } from '@/lib/deepgram-order-transcript'
import { VideoResourceSchema } from '@/lib/video-resource'
import { sanityQuery } from '@/server/sanity.server'
import { NonRetriableError } from 'inngest'

export const orderTranscript = inngest.createFunction(
  { id: `order-transcript`, name: 'Order Transcript from Deepgram' },
  { event: VIDEO_RESOURCE_CREATED_EVENT },
  async ({ event, step }) => {
    const videoResource = await step.run('Load Video Resource', async () => {
      const resourceTemp = VideoResourceSchema.safeParse(
        await sanityQuery(`*[_type == "videoResource" && _id == "${event.data.videoResourceId}"][0]`, {
          useCdn: false,
        }),
      )
      return resourceTemp.success ? resourceTemp.data : null
    })

    if (!videoResource) {
      throw new NonRetriableError('Video Resource not found')
    }

    const deepgram = await step.run('Order Transcript [Deepgram]', async () => {
      return await orderDeepgramTranscript({
        moduleSlug: event.data.moduleSlug,
        mediaUrl: event.data.originalMediaUrl,
        videoResourceId: event.data.videoResourceId,
      })
    })

    return { deepgram, videoResource }
  },
)
