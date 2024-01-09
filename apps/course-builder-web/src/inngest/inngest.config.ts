import {inngest} from '@/inngest/inngest.server'
import {writeAnEmail} from '@/inngest/functions/ai/writer'
import {
  muxVideoAssetCreated,
  muxVideoAssetReady,
} from '@/inngest/functions/mux/mux-webhooks-handlers'
import {transcriptReady} from '@/inngest/functions/transcript-ready'
import {videoUploaded} from '@/inngest/functions/video-uploaded'
import {addSrtToMuxAsset} from '@/inngest/functions/mux/add-srt-to-mux-asset'
import {userCreated} from '@/inngest/functions/user-created'
import {weeklySignupDigest} from '@/inngest/functions/notify/creator/weekly-signups'
import {userSignupAdminEmail} from '@/inngest/functions/notify/creator/user-signup'
import {postmarkWebhook} from '@/inngest/functions/postmark/postmarks-webhooks-handler'
import {cloudinaryAssetCreated} from '@/inngest/functions/cloudinary/cloudinary-webhooks-handlers'
import {tipChat} from '@/inngest/functions/tips/chat'
import {articleChat} from '@/inngest/functions/articles/chat'
import {generateFeedbackMarkers} from '@/inngest/functions/ai/feedback-markers'

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
