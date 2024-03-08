import { generateTranscriptWithScreenshots } from '@/inngest/functions/ai/data/generate-transcript-with-screnshots'
import { generateFeedbackMarkers } from '@/inngest/functions/ai/feedback-markers'
import { articleChat } from '@/inngest/functions/articles/chat'
import { cloudinaryAssetCreated } from '@/inngest/functions/cloudinary/cloudinary-webhooks-handlers'
import { deepgramTranscriptReady } from '@/inngest/functions/deepgram/deepgram-webhook-handlers'
import { orderTranscript } from '@/inngest/functions/deepgram/order-transcript'
import { emailSendBroadcast } from '@/inngest/functions/email-send-broadcast'
import { addSrtToMuxAsset } from '@/inngest/functions/mux/add-srt-to-mux-asset'
import {
  muxVideoAssetCreated,
  muxVideoAssetError,
  muxVideoAssetReady,
} from '@/inngest/functions/mux/mux-webhooks-handlers'
import { userSignupAdminEmail } from '@/inngest/functions/notify/creator/user-signup'
import { weeklySignupDigest } from '@/inngest/functions/notify/creator/weekly-signups'
import { performCodeExtraction } from '@/inngest/functions/ocr/ocr-code-extractor'
import { postmarkWebhook } from '@/inngest/functions/postmark/postmarks-webhooks-handler'
import { removeCompletedVideo } from '@/inngest/functions/remove-completed-video'
import { tipChat } from '@/inngest/functions/tips/chat'
import { userCreated } from '@/inngest/functions/user-created'
import { videoUploaded } from '@/inngest/functions/video-uploaded'
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
    tipChat,
    articleChat,
    generateFeedbackMarkers,
    generateTranscriptWithScreenshots,
    deepgramTranscriptReady,
    removeCompletedVideo,
    orderTranscript,
    emailSendBroadcast,
    performCodeExtraction,
  ],
}
