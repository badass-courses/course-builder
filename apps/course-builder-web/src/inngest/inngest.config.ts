import { imageResourceCreated } from '@/inngest/functions/cloudinary/image-resource-created'
import { emailSendBroadcast } from '@/inngest/functions/email-send-broadcast'
import { userSignupAdminEmail } from '@/inngest/functions/notify/creator/user-signup'
import { performCodeExtraction } from '@/inngest/functions/ocr/ocr-code-extractor'
import { postmarkWebhook } from '@/inngest/functions/postmark/postmarks-webhooks-handler'
import { resourceChat } from '@/inngest/functions/resource-chat'
import { userCreated } from '@/inngest/functions/user-created'
import { inngest } from '@/inngest/inngest.server'

import { coreVideoProcessingFunctions } from '@coursebuilder/core/inngest/video-processing/functions'

import { getOrCreateConcept } from './functions/concepts/get-or-create-tag'
import { computeVideoSplitPoints } from './functions/split_video'

export const inngestConfig = {
  client: inngest,
  functions: [
    ...coreVideoProcessingFunctions.map(({ config, trigger, handler }) =>
      inngest.createFunction(config, trigger, handler),
    ),
    userCreated,
    userSignupAdminEmail,
    postmarkWebhook,
    imageResourceCreated,
    resourceChat,
    emailSendBroadcast,
    performCodeExtraction,
    getOrCreateConcept,
    computeVideoSplitPoints,
  ],
}
