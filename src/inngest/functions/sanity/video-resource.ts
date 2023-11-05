import {inngest} from "@/inngest/inngest.server";
import {VIDEO_UPLOADED_EVENT} from "@/inngest/events/video-uploaded";
import {sanityMutation} from "@/server/sanity.server";
import {env} from "@/env.mjs";
import {getMuxOptions} from "@/lib/get-mux-options";
import {TRANSCRIPT_REQUESTED_EVENT} from "@/inngest/events/transcript-requested";

export const videoUploaded = inngest.createFunction(
  {id: `video-uploaded`, name: 'Video Uploaded'},
  {event: VIDEO_UPLOADED_EVENT},
  async ({event, step}) => {

    const videoResource = await step.run('create the video resource in Sanity', async () => {
      return sanityMutation( [
        {"createOrReplace": {
            "_id": event.data.fileName,
            "_type": "videoResource",
            "originalMediaUrl": event.data.originalMediaUrl,
            "state": `processing`,
            "title": event.data.fileName,
          }}
      ])
    })

    const muxAsset = await step.run('create the mux asset', async () => {
      const baseUrl = 'https://api.mux.com'

      const muxOptions = getMuxOptions({url: event.data.originalMediaUrl, passthrough: event.data.fileName})

      const response = await fetch(`${baseUrl}/video/v1/assets`, {
        headers: {
          Authorization: `Basic ${Buffer.from(`${env.MUX_ACCESS_TOKEN_ID}:${env.MUX_SECRET_KEY}`).toString('base64')}`,
          "Content-Type": "application/json"
        },
        method: 'POST',
        body: JSON.stringify(muxOptions.new_asset_settings)
      })

      const {data} = await response.json()
      return data
    })

    await step.run('update the video resource in Sanity', async () => {
      const playbackId = muxAsset.playback_ids.filter((playbackId: any) => playbackId.policy === 'public')[0]?.id
      return await sanityMutation([
        {"patch": {
            "id": event.data.fileName,
            "set": {
              muxAssetId: muxAsset.id,
              muxPlaybackId: playbackId,
              state: `processing`,
            }
          }
        },
      ])
    })

    await step.sendEvent('Order Transcript for New Video', {
      name: TRANSCRIPT_REQUESTED_EVENT,
      data: {
        videoResourceId: event.data.fileName,
        mediaUrl:  event.data.originalMediaUrl
      }
    })

    return {data: event.data, videoResource, muxAsset}
  }
)

