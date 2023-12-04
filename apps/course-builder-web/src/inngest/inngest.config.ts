import {inngest} from '@/inngest/inngest.server'
import {writeAnEmail} from '@/inngest/functions/ai/writer'
import {
  muxVideoAssetCreated,
  muxVideoAssetReady,
} from '@/inngest/functions/mux/mux-webhooks-handlers'
import {transcriptReady} from '@/inngest/functions/transcript-ready'
import {videoUploaded} from '@/inngest/functions/video-uploaded'
import {addSrtToMuxAsset} from '@/inngest/functions/mux/add-srt-to-mux-asset'
import {tipTitleAndSummaryWriter} from '@/inngest/functions/ai/tip-writer'
import {userCreated} from '@/inngest/functions/user-created'

export const inngestConfig = {
  client: inngest,
  functions: [
    writeAnEmail,
    muxVideoAssetCreated,
    muxVideoAssetReady,
    transcriptReady,
    videoUploaded,
    addSrtToMuxAsset,
    tipTitleAndSummaryWriter,
    userCreated,
  ],
}
