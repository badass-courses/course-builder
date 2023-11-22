import {inngest} from '@/inngest/inngest.server'
import {VIDEO_UPLOADED_EVENT} from '@/inngest/events/video-uploaded'
import {sanityMutation, sanityQuery} from '@/server/sanity.server'
import {env} from '@/env.mjs'
import {getMuxOptions} from '@/lib/get-mux-options'
import {orderDeepgramTranscript} from '@/lib/deepgram-order-transcript'

export const videoUploaded = inngest.createFunction(
  {id: `video-uploaded`, name: 'Video Uploaded'},
  {event: VIDEO_UPLOADED_EVENT},
  async ({event, step}) => {
    const muxAsset = await step.run('create the mux asset', async () => {
      const baseUrl = 'https://api.mux.com'

      const muxOptions = getMuxOptions({
        url: event.data.originalMediaUrl,
        passthrough: event.data.fileName,
      })

      const response = await fetch(`${baseUrl}/video/v1/assets`, {
        headers: {
          Authorization: `Basic ${Buffer.from(
            `${env.MUX_ACCESS_TOKEN_ID}:${env.MUX_SECRET_KEY}`,
          ).toString('base64')}`,
          'Content-Type': 'application/json',
        },
        method: 'POST',
        body: JSON.stringify(muxOptions.new_asset_settings),
      })

      const {data} = await response.json()
      return data
    })

    const videoResource = await step.run(
      'create the video resource in Sanity',
      async () => {
        const playbackId = muxAsset.playback_ids.filter(
          (playbackId: any) => playbackId.policy === 'public',
        )[0]?.id
        await sanityMutation([
          {
            createOrReplace: {
              _id: event.data.fileName,
              _type: 'videoResource',
              originalMediaUrl: event.data.originalMediaUrl,
              title: event.data.fileName,
              muxAssetId: muxAsset.id,
              muxPlaybackId: playbackId,
              state: `processing`,
            },
          },
        ])

        return await sanityQuery(
          `*[_type == "videoResource" && _id == "${event.data.fileName}"][0]`,
        )
      },
    )

    await step.run('announce video resource created', async () => {
      await fetch(
        `${env.NEXT_PUBLIC_PARTY_KIT_URL}/party/${env.NEXT_PUBLIC_PARTYKIT_ROOM_NAME}`,
        {
          method: 'POST',
          body: JSON.stringify({
            body: `Video Resource Created: ${event.data.fileName}`,
            requestId: event.data.fileName,
            name: 'videoResource.created',
          }),
        },
      ).catch((e) => {
        console.error(e)
      })
    })

    const deepgram = await step.run('Order Transcript [Deepgram]', async () => {
      return await orderDeepgramTranscript({
        moduleSlug: event.data.moduleSlug,
        mediaUrl: event.data.originalMediaUrl,
        videoResourceId: event.data.fileName,
      })
    })

    return {data: event.data, videoResource, muxAsset, deepgram}
  },
)
