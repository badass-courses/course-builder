import { imageResourceCreated } from '@/inngest/functions/cloudinary/image-resource-created'
import { addPurchasesConvertkit } from '@/inngest/functions/convertkit/add-purchased-convertkit'
import { addSubscriptionRoleDiscord } from '@/inngest/functions/discord/add-subscription-discord-role'
import { discordAccountLinked } from '@/inngest/functions/discord/discord-account-linked'
import { removePurchaseRoleDiscord } from '@/inngest/functions/discord/remove-purchase-role-discord'
import { emailSendBroadcast } from '@/inngest/functions/email-send-broadcast'
import { ensurePersonalOrganizationWorkflow } from '@/inngest/functions/ensure-personal-organization'
import { userSignupAdminEmail } from '@/inngest/functions/notify/creator/user-signup'
import { performCodeExtraction } from '@/inngest/functions/ocr/ocr-code-extractor'
import { postmarkWebhook } from '@/inngest/functions/postmark/postmarks-webhooks-handler'
import { refundEntitlements } from '@/inngest/functions/refund/refund-entitlements'
import { sendWorkshopAccessEmails } from '@/inngest/functions/send-workshop-access-emails'
import { syncPurchaseTags } from '@/inngest/functions/sync-purchase-tags'
import { userCreated } from '@/inngest/functions/user-created'
import { inngest } from '@/inngest/inngest.server'

import { courseBuilderCoreFunctions } from '@coursebuilder/core/inngest'

import { cohortEntitlementSyncWorkflow } from './functions/cohort-entitlement-sync-workflow'
import { getOrCreateConcept } from './functions/concepts/get-or-create-tag'
import { createUserOrganizations } from './functions/create-user-organization'
import { addDiscordRoleWorkflow } from './functions/discord/add-discord-role-workflow'
import { postPurchaseWorkflow } from './functions/post-purchase-workflow'
import {
	apiProductTransferWorkflow,
	productTransferWorkflow,
} from './functions/product-transfer-workflow'
import { computeVideoSplitPoints } from './functions/split_video'
import { stripeSubscriptionCheckoutSessionComplete } from './functions/stripe/event-subscription-checkout-session-completed'
import { handleSubscriptionUpdated } from './functions/stripe/handle-subscription-updated'
import {
	videoResourceAttached,
	videoResourceDetached,
} from './functions/video-resource-attached'

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
		addSubscriptionRoleDiscord,
		removePurchaseRoleDiscord,
		postPurchaseWorkflow,
		productTransferWorkflow,
		apiProductTransferWorkflow,
		cohortEntitlementSyncWorkflow,
		syncPurchaseTags,
		addPurchasesConvertkit,
		stripeSubscriptionCheckoutSessionComplete,
		handleSubscriptionUpdated,
		createUserOrganizations,
		ensurePersonalOrganizationWorkflow,
		videoResourceAttached,
		videoResourceDetached,
		addDiscordRoleWorkflow,
		sendWorkshopAccessEmails,
		refundEntitlements,
	],
}
