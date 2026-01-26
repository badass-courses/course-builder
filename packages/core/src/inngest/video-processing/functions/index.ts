import { addSrtToMuxAsset } from './add-srt-to-mux-asset'
import { autoGeneratePostSeoDescription } from './auto-generate-post-seo-description'
import { orderTranscript } from './order-transcript'
import { removeCompletedVideo } from './remove-completed-video'
import { transcriptReady } from './transcript-ready'
import { videoProcessingError } from './video-processing-error'
import { videoReady } from './video-ready'
import { videoUploaded } from './video-uploaded'

export const coreVideoProcessingFunctions = [
	transcriptReady,
	addSrtToMuxAsset,
	orderTranscript,
	removeCompletedVideo,
	videoProcessingError,
	videoReady,
	videoUploaded,
	autoGeneratePostSeoDescription,
]
