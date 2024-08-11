import { imageResourceCreated } from '@/inngest/functions/cloudinary/image-resource-created'
import { emailSendBroadcast } from '@/inngest/functions/email-send-broadcast'
import { learnerProgress } from '@/inngest/functions/learner-progress'
import { userSignupAdminEmail } from '@/inngest/functions/notify/creator/user-signup'
import { performCodeExtraction } from '@/inngest/functions/ocr/ocr-code-extractor'
import { postmarkWebhook } from '@/inngest/functions/postmark/postmarks-webhooks-handler'
import { userCreated } from '@/inngest/functions/user-created'
import { waitForProgress } from '@/inngest/functions/wait-for-progress'
import { inngest } from '@/inngest/inngest.server'

import { courseBuilderCoreFunctions } from '@coursebuilder/core/inngest'

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
		emailSendBroadcast,
		performCodeExtraction,
		getOrCreateConcept,
		computeVideoSplitPoints,
		waitForProgress,
		learnerProgress,
	],
}
