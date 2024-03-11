import { imageResourceCreated } from '@/inngest/functions/cloudinary/image-resource-created'
import { emailSendBroadcast } from '@/inngest/functions/email-send-broadcast'
import { userSignupAdminEmail } from '@/inngest/functions/notify/creator/user-signup'
import { performCodeExtraction } from '@/inngest/functions/ocr/ocr-code-extractor'
import { postmarkWebhook } from '@/inngest/functions/postmark/postmarks-webhooks-handler'
import { resourceChat } from '@/inngest/functions/resource-chat'
import { userCreated } from '@/inngest/functions/user-created'
import { inngest } from '@/inngest/inngest.server'
import { addSrtToMuxAsset } from '@/inngest/video-processing/add-srt-to-mux-asset'
import { generateTranscriptWithScreenshots } from '@/inngest/video-processing/generate-transcript-with-screnshots'
import { orderTranscript } from '@/inngest/video-processing/order-transcript'
import { removeCompletedVideo } from '@/inngest/video-processing/remove-completed-video'
import { deepgramTranscriptReady } from '@/inngest/video-processing/transcript-ready'
import { videoProcessingError } from '@/inngest/video-processing/video-processing-error'
import { videoReady } from '@/inngest/video-processing/video-ready'
import { videoUploaded } from '@/inngest/video-processing/video-uploaded'

export const inngestConfig = {
  client: inngest,
  functions: [
    videoReady,
    videoProcessingError,
    videoUploaded,
    addSrtToMuxAsset,
    userCreated,
    userSignupAdminEmail,
    postmarkWebhook,
    imageResourceCreated,
    resourceChat,
    generateTranscriptWithScreenshots,
    deepgramTranscriptReady,
    removeCompletedVideo,
    orderTranscript,
    emailSendBroadcast,
    performCodeExtraction,
  ],
}
