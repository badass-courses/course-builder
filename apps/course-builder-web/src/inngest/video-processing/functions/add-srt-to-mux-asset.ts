import { inngest } from '@/inngest/inngest.server'

import {
  addSrtToMuxAssetConfig,
  addSrtToMuxAssetHandler,
  addSrtToMuxAssetTrigger,
} from '@coursebuilder/core/inngest/video-processing/functions/add-srt-to-mux-asset'

export const addSrtToMuxAsset = inngest.createFunction(
  addSrtToMuxAssetConfig,
  addSrtToMuxAssetTrigger,
  addSrtToMuxAssetHandler,
)
