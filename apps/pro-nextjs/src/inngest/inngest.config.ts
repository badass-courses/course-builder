import { imageResourceCreated } from '@/inngest/functions/cloudinary/image-resource-created'
import { addPurchaseRoleDiscord } from '@/inngest/functions/discord/add-purchase-role-discord'
import { discordAccountLinked } from '@/inngest/functions/discord/discord-account-linked'
import { removePurchaseRoleDiscord } from '@/inngest/functions/discord/remove-purchase-role-discord'
import { emailSendBroadcast } from '@/inngest/functions/email-send-broadcast'
import { noProgressContinued } from '@/inngest/functions/no-progress-continued'
import { userSignupAdminEmail } from '@/inngest/functions/notify/creator/user-signup'
import { performCodeExtraction } from '@/inngest/functions/ocr/ocr-code-extractor'
import { postPurchaseNoProgress } from '@/inngest/functions/post-purchase-no-progress'
import { postPurchaseWaitForProgress } from '@/inngest/functions/post-purchase-wait-for-progress'
import { postPurchaseWorkflow } from '@/inngest/functions/post-purchase-workflow'
import { postmarkWebhook } from '@/inngest/functions/postmark/postmarks-webhooks-handler'
import { progressWasMade } from '@/inngest/functions/progress-was-made'
import { userCreated } from '@/inngest/functions/user-created'
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
		discordAccountLinked,
		addPurchaseRoleDiscord,
		removePurchaseRoleDiscord,
		postPurchaseWorkflow,
		progressWasMade,
		postPurchaseWaitForProgress,
		postPurchaseNoProgress,
		noProgressContinued,
	],
}
