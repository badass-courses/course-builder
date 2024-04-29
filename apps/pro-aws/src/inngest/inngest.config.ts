import { imageResourceCreated } from '@/inngest/functions/cloudinary/image-resource-created'
import { emailSendBroadcast } from '@/inngest/functions/email-send-broadcast'
import { userSignupAdminEmail } from '@/inngest/functions/notify/creator/user-signup'
import { performCodeExtraction } from '@/inngest/functions/ocr/ocr-code-extractor'
import { postmarkWebhook } from '@/inngest/functions/postmark/postmarks-webhooks-handler'
import { userCreated } from '@/inngest/functions/user-created'
import { inngest } from '@/inngest/inngest.server'

import { courseBuilderCoreFunctions } from '@coursebuilder/core/inngest'
import {
	resourceChat,
	resourceChatConfig,
	resourceChatTrigger,
} from '@coursebuilder/core/inngest/co-gardener/resource-chat'

import { getOrCreateConcept } from './functions/concepts/get-or-create-tag'
import { computeVideoSplitPoints } from './functions/split_video'

export const inngestConfig = {
	client: inngest,
	functions: [
		...courseBuilderCoreFunctions.map(({ config, trigger, handler }) =>
			inngest.createFunction(config, trigger, handler),
		),
		userCreated,
		userSignupAdminEmail,
		postmarkWebhook,
		imageResourceCreated,
		inngest.createFunction(
			resourceChatConfig,
			resourceChatTrigger,
			resourceChat,
		),
		emailSendBroadcast,
		performCodeExtraction,
		getOrCreateConcept,
		computeVideoSplitPoints,
	],
}
