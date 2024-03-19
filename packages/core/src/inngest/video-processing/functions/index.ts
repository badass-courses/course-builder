import { addSrtToMuxAsset } from './add-srt-to-mux-asset'
import { generateTranscriptWithScreenshots } from './generate-transcript-with-screnshots'
import { orderTranscript } from './order-transcript'
import { removeCompletedVideo } from './remove-completed-video'
import { transcriptReady } from './transcript-ready'
import { videoProcessingError } from './video-processing-error'
import { videoReady } from './video-ready'
import { videoUploaded } from './video-uploaded'

export * from './add-srt-to-mux-asset'
export * from './generate-transcript-with-screnshots'
export * from './order-transcript'
export * from './transcript-ready'
export * from './video-processing-error'
export * from './video-ready'
export * from './video-uploaded'
export * from './remove-completed-video'

export const videoProcessingFunctions = [
  addSrtToMuxAsset,
  generateTranscriptWithScreenshots,
  orderTranscript,
  transcriptReady,
  videoProcessingError,
  videoReady,
  videoUploaded,
  removeCompletedVideo,
]
