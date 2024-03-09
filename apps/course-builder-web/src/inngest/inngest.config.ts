import { cloudinaryAssetCreated } from '@/inngest/functions/cloudinary/cloudinary-webhooks-handlers'
import { emailSendBroadcast } from '@/inngest/functions/email-send-broadcast'
import { userSignupAdminEmail } from '@/inngest/functions/notify/creator/user-signup'
import { weeklySignupDigest } from '@/inngest/functions/notify/creator/weekly-signups'
import { performCodeExtraction } from '@/inngest/functions/ocr/ocr-code-extractor'
import { postmarkWebhook } from '@/inngest/functions/postmark/postmarks-webhooks-handler'
import { resourceChat } from '@/inngest/functions/resource-chat'
import { userCreated } from '@/inngest/functions/user-created'
import { addSrtToMuxAsset } from '@/inngest/functions/video-processing/add-srt-to-mux-asset'
import { deepgramTranscriptReady } from '@/inngest/functions/video-processing/deepgram-webhook-handlers'
import { generateTranscriptWithScreenshots } from '@/inngest/functions/video-processing/generate-transcript-with-screnshots'
import {
  muxVideoAssetCreated,
  muxVideoAssetError,
  muxVideoAssetReady,
} from '@/inngest/functions/video-processing/mux-webhooks-handlers'
import { orderTranscript } from '@/inngest/functions/video-processing/order-transcript'
import { removeCompletedVideo } from '@/inngest/functions/video-processing/remove-completed-video'
import { videoUploaded } from '@/inngest/functions/video-processing/video-uploaded'
import { inngest } from '@/inngest/inngest.server'

export const inngestConfig = {
  client: inngest,
  functions: [
    muxVideoAssetCreated,
    muxVideoAssetReady,
    muxVideoAssetError,
    videoUploaded,
    addSrtToMuxAsset,
    userCreated,
    weeklySignupDigest,
    userSignupAdminEmail,
    postmarkWebhook,
    cloudinaryAssetCreated,
    resourceChat,
    generateTranscriptWithScreenshots,
    deepgramTranscriptReady,
    removeCompletedVideo,
    orderTranscript,
    emailSendBroadcast,
    performCodeExtraction,
  ],
}
