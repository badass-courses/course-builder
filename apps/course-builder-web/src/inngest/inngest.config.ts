import { imageResourceCreated } from '@/inngest/functions/cloudinary/image-resource-created'
import { emailSendBroadcast } from '@/inngest/functions/email-send-broadcast'
import { userSignupAdminEmail } from '@/inngest/functions/notify/creator/user-signup'
import { performCodeExtraction } from '@/inngest/functions/ocr/ocr-code-extractor'
import { postmarkWebhook } from '@/inngest/functions/postmark/postmarks-webhooks-handler'
import { userCreated } from '@/inngest/functions/user-created'
import { inngest } from '@/inngest/inngest.server'

import {
	resourceChat,
	resourceChatConfig,
	resourceChatTrigger,
} from '@coursebuilder/core/inngest/co-gardener/resource-chat'
import {
	stripeCheckoutSessionCompletedConfig,
	stripeCheckoutSessionCompletedHandler,
	stripeCheckoutSessionCompletedTrigger,
} from '@coursebuilder/core/inngest/stripe/event-checkout-session-completed'
import { coreVideoProcessingFunctions } from '@coursebuilder/core/inngest/video-processing/functions'

import { getOrCreateConcept } from './functions/concepts/get-or-create-tag'
import { computeVideoSplitPoints } from './functions/split_video'

export const inngestConfig = {
	client: inngest,
	functions: [
		...coreVideoProcessingFunctions.map(({ config, trigger, handler }) =>
			inngest.createFunction(config, trigger, handler),
		),
		inngest.createFunction(
			stripeCheckoutSessionCompletedConfig,
			stripeCheckoutSessionCompletedTrigger,
			stripeCheckoutSessionCompletedHandler,
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
