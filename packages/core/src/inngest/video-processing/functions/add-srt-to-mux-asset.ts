import { NonRetriableError } from 'inngest'

import { addSrtTrackToMuxAsset, deleteSrtTrackFromMuxAsset, getMuxAsset } from '../../../lib/mux'
import { inngest } from '../../inngest.server'
import { VIDEO_SRT_READY_EVENT } from '../events'

const COOLDOWN = 20000

export const addSrtToMuxAsset = inngest.createFunction(
  {
    id: 'add-srt-mux-asset',
    name: 'Add SRT to Mux Asset',
  },
  { event: VIDEO_SRT_READY_EVENT },
  async ({ event, step, db }) => {
    const videoResource = await step.run('get the video resource from Sanity', async () => {
      return db.getVideoResource(event.data.videoResourceId)
    })

    if (videoResource) {
      const muxAsset = await step.run('get the mux asset', async () => {
        const assetId = videoResource.muxAssetId
        return getMuxAsset(assetId)
      })

      if (!muxAsset) {
        throw new NonRetriableError('Mux Asset not found')
      }

      if (muxAsset.status === 'ready') {
        await step.run('delete existing srt track from mux asset', async () => {
          return await deleteSrtTrackFromMuxAsset(muxAsset.id)
        })

        await step.run('add srt track to mux asset', async () => {
          return db.addSrtTrackToMuxAsset({
            assetId: muxAsset.id,
            videoResourceId: videoResource._id,
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
