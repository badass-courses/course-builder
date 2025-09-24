import { imageResourceCreated } from '@/inngest/functions/cloudinary/image-resource-created'
import { addPurchasesConvertkit } from '@/inngest/functions/convertkit/add-purchased-convertkit'
import { addSubscriptionRoleDiscord } from '@/inngest/functions/discord/add-purchase-role-discord'
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
import {
	apiTransferWorkflow,
	cohortTransferWorkflow,
} from './functions/cohort-transfer-workflow'
import { getOrCreateConcept } from './functions/concepts/get-or-create-tag'
import { createUserOrganizations } from './functions/create-user-organization'
import { addCohortRoleDiscord } from './functions/discord/add-cohort-role-discord'
import { addWorkshopRoleDiscord } from './functions/discord/add-workshop-role-discord'
import { postCohortPurchaseWorkflow } from './functions/post-cohort-purchase-workflow'
import { postWorkshopPurchaseWorkflow } from './functions/post-workshop-purchase-workflow'
import { computeVideoSplitPoints } from './functions/split_video'
import { stripeSubscriptionCheckoutSessionComplete } from './functions/stripe/event-subscription-checkout-session-completed'
import {
	videoResourceAttached,
	videoResourceDetached,
} from './functions/video-resource-attached'
import { workshopTransferWorkflow } from './functions/workshop-transfer-workflow'

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
		postCohortPurchaseWorkflow,
		postWorkshopPurchaseWorkflow,
		cohortTransferWorkflow,
		workshopTransferWorkflow,
		apiTransferWorkflow,
		cohortEntitlementSyncWorkflow,
		syncPurchaseTags,
		addPurchasesConvertkit,
		stripeSubscriptionCheckoutSessionComplete,
		createUserOrganizations,
		ensurePersonalOrganizationWorkflow,
		videoResourceAttached,
		videoResourceDetached,
		addCohortRoleDiscord,
		addWorkshopRoleDiscord,
		sendWorkshopAccessEmails,
		refundEntitlements,
	],
}
