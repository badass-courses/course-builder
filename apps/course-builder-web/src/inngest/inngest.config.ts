import { generateFeedbackMarkers } from '@/inngest/functions/ai/feedback-markers'
import { writeAnEmail } from '@/inngest/functions/ai/writer'
import { articleChat } from '@/inngest/functions/articles/chat'
import { cloudinaryAssetCreated } from '@/inngest/functions/cloudinary/cloudinary-webhooks-handlers'
import { addSrtToMuxAsset } from '@/inngest/functions/mux/add-srt-to-mux-asset'
import { muxVideoAssetCreated, muxVideoAssetReady } from '@/inngest/functions/mux/mux-webhooks-handlers'
import { userSignupAdminEmail } from '@/inngest/functions/notify/creator/user-signup'
import { weeklySignupDigest } from '@/inngest/functions/notify/creator/weekly-signups'
import { postmarkWebhook } from '@/inngest/functions/postmark/postmarks-webhooks-handler'
import { tipChat } from '@/inngest/functions/tips/chat'
import { transcriptReady } from '@/inngest/functions/transcript-ready'
import { userCreated } from '@/inngest/functions/user-created'
import { videoUploaded } from '@/inngest/functions/video-uploaded'
import { inngest } from '@/inngest/inngest.server'

export const inngestConfig = {
  client: inngest,
  functions: [
    writeAnEmail,
    muxVideoAssetCreated,
    muxVideoAssetReady,
    transcriptReady,
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
  ],
}
