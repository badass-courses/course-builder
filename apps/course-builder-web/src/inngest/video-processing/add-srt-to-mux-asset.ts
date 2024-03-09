import { env } from '@/env.mjs'
import { inngest } from '@/inngest/inngest.server'
import { VIDEO_SRT_READY_EVENT } from '@/inngest/video-processing/events/video-srt-ready-to-asset'
import { getVideoResource } from '@/lib/video-resource-query'

const COOLDOWN = 20000

export const addSrtToMuxAsset = inngest.createFunction(
  {
    id: 'add-srt-mux-asset',
    name: 'Add SRT to Mux Asset',
  },
  { event: VIDEO_SRT_READY_EVENT },
  async ({ event, step }) => {
    const videoResource = await step.run('get the video resource from Sanity', async () => {
      return getVideoResource(event.data.videoResourceId)
    })

    if (videoResource) {
      const muxAsset = await step.run('get the mux asset', async () => {
        const assetId = videoResource.muxAssetId
        const { data } = await fetch(`https://api.mux.com/video/v1/assets/${assetId}`, {
          headers: {
            Authorization: `Basic ${Buffer.from(`${env.MUX_ACCESS_TOKEN_ID}:${env.MUX_SECRET_KEY}`).toString(
              'base64',
            )}`,
            'Content-Type': 'application/json',
          },
        }).then(async (response) => await response.json())
        return data
      })

      if (muxAsset.status === 'ready') {
        await step.run('delete existing srt track from mux asset', async () => {
          const trackId = muxAsset.tracks.filter((track: { type: string; status: string }) => track.type === 'text')[0]
            ?.id
          return await fetch(`https://api.mux.com/video/v1/assets/${videoResource.muxAssetId}/tracks/${trackId}`, {
            method: 'DELETE',
            headers: {
              Authorization: `Basic ${Buffer.from(`${env.MUX_ACCESS_TOKEN_ID}:${env.MUX_SECRET_KEY}`).toString(
                'base64',
              )}`,
              'Content-Type': 'application/json',
            },
          }).catch((error) => {
            console.error(error)
          })
        })

        await step.run('add srt track to mux asset', async () => {
          return await fetch(`https://api.mux.com/video/v1/assets/${muxAsset.id}/tracks`, {
            method: 'POST',
            headers: {
              Authorization: `Basic ${Buffer.from(`${env.MUX_ACCESS_TOKEN_ID}:${env.MUX_SECRET_KEY}`).toString(
                'base64',
              )}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              url: `${env.NEXTAUTH_URL}/api/videos/${videoResource._id}/srt`,
              type: 'text',
              text_type: 'subtitles',
              closed_captions: true,
              language_code: 'en-US',
              name: 'English',
              passthrough: 'English',
            }),
          })
            .then(async (response) => await response.json())
            .catch((error) => {
              console.error(error)
            })
        })

        return { muxAsset, videoResource }
      } else if (muxAsset.status !== 'errored') {
        await step.sleep(`wait for ${COOLDOWN / 1000} seconds`, COOLDOWN)
        await step.sendEvent('Re-run After Cool Down', {
          name: VIDEO_SRT_READY_EVENT,
          data: event.data,
        })
        return 'asset not ready yet'
      } else {
        throw new Error('Mux Asset is in errored state')
      }
    }
  },
)
