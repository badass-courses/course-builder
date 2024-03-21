import { NonRetriableError } from 'inngest'

import {
	addSrtTrackToMuxAsset,
	deleteSrtTrackFromMuxAsset,
	getMuxAsset,
} from '../../../lib/mux'
import {
	CoreInngestFunctionInput,
	CoreInngestHandler,
	CoreInngestTrigger,
} from '../../create-inngest-middleware'
import { VIDEO_SRT_READY_EVENT } from '../events/event-video-srt-ready-to-asset'

const COOLDOWN = 20000

export const addSrtToMuxAssetConfig = {
	id: 'add-srt-mux-asset',
	name: 'Add SRT to Mux Asset',
}

export const addSrtToMuxAssetTrigger: CoreInngestTrigger = {
	event: VIDEO_SRT_READY_EVENT,
}

export const addSrtToMuxAssetHandler: CoreInngestHandler = async ({
	event,
	step,
	db,
	siteRootUrl,
}: CoreInngestFunctionInput) => {
	const videoResource = await step.run(
		'get the video resource from Sanity',
		async () => {
			return db.getVideoResource(event.data.videoResourceId)
		},
	)

	if (videoResource) {
		let muxAsset = await step.run('get the mux asset', async () => {
			const assetId = videoResource.muxAssetId
			return getMuxAsset(assetId)
		})

		if (!muxAsset) {
			throw new NonRetriableError('Mux Asset not found')
		}

		if (muxAsset.status === 'ready') {
			await step.run('delete existing srt track from mux asset', async () => {
				return await deleteSrtTrackFromMuxAsset(muxAsset?.id)
			})

			await step.run('add srt track to mux asset', async () => {
				return addSrtTrackToMuxAsset({
					assetId: muxAsset?.id,
					srtUrl: `${siteRootUrl}/api/coursebuilder/srt/internal?videoResourceId=${videoResource._id}`,
				})
			})

			muxAsset = await step.run('get the updated mux asset', async () => {
				const assetId = videoResource.muxAssetId
				return getMuxAsset(assetId)
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
}

export const addSrtToMuxAsset = {
	config: addSrtToMuxAssetConfig,
	trigger: addSrtToMuxAssetTrigger,
	handler: addSrtToMuxAssetHandler,
}
