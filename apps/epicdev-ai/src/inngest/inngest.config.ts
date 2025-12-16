import { imageResourceCreated } from '@/inngest/functions/cloudinary/image-resource-created'
import { addPurchasesConvertkit } from '@/inngest/functions/convertkit/add-purchased-convertkit'
import { discordAccountLinked } from '@/inngest/functions/discord/discord-account-linked'
import { removePurchaseRoleDiscord } from '@/inngest/functions/discord/remove-purchase-role-discord'
import { emailSendBroadcast } from '@/inngest/functions/email-send-broadcast'
import { ensurePersonalOrganizationWorkflow } from '@/inngest/functions/ensure-personal-organization'
import { userSignupAdminEmail } from '@/inngest/functions/notify/creator/user-signup'
import { performCodeExtraction } from '@/inngest/functions/ocr/ocr-code-extractor'
import { sendWelcomeEmail } from '@/inngest/functions/post-purchase-automation/send-welcome-email'
import { postmarkWebhook } from '@/inngest/functions/postmark/postmarks-webhooks-handler'
import { refundEntitlements } from '@/inngest/functions/refund/refund-entitlements'
import { sendWorkshopAccessEmails } from '@/inngest/functions/send-workshop-access-emails'
import { syncPurchaseTags } from '@/inngest/functions/sync-purchase-tags'
import { unlistPastEvents } from '@/inngest/functions/unlist-past-events'
import { userCreated } from '@/inngest/functions/user-created'
import { inngest } from '@/inngest/inngest.server'

import { courseBuilderCoreFunctions } from '@coursebuilder/core/inngest'

import { backfillDiscordRoleEntitlements } from './functions/backfill-discord-role-entitlements'
import { processBulkCalendarInvites } from './functions/bulk-calendar-invites'
import {
	calendarSync,
	handleRefundAndRemoveFromCalendar,
} from './functions/calendar-sync'
import { cohortEntitlementSyncWorkflow } from './functions/cohort-entitlement-sync-workflow'
import { getOrCreateConcept } from './functions/concepts/get-or-create-tag'
import { createUserOrganizations } from './functions/create-user-organization'
import { addDiscordRoleWorkflow } from './functions/discord/add-discord-role-workflow'
import { eventReminderBroadcast } from './functions/event-reminder-broadcast'
import { postEventPurchase } from './functions/post-event-purchase'
import { postPurchaseWorkflow } from './functions/post-purchase-workflow'
import {
	apiProductTransferWorkflow,
	productTransferWorkflow,
} from './functions/product-transfer-workflow'
import { computeVideoSplitPoints } from './functions/split_video'
import { stripeSubscriptionCheckoutSessionComplete } from './functions/stripe/event-subscription-checkout-session-completed'
import { syncDiscordRolesForEntitlements } from './functions/sync-discord-roles-for-entitlements'
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
		removePurchaseRoleDiscord,
		postPurchaseWorkflow,
		productTransferWorkflow,
		apiProductTransferWorkflow,
		cohortEntitlementSyncWorkflow,
		syncPurchaseTags,
		addPurchasesConvertkit,
		stripeSubscriptionCheckoutSessionComplete,
		createUserOrganizations,
		ensurePersonalOrganizationWorkflow,
		videoResourceAttached,
		videoResourceDetached,
		sendWelcomeEmail,
		calendarSync,
		postEventPurchase,
		handleRefundAndRemoveFromCalendar,
		unlistPastEvents,
		eventReminderBroadcast,
		addDiscordRoleWorkflow,
		sendWorkshopAccessEmails,
		refundEntitlements,
		processBulkCalendarInvites,
		backfillDiscordRoleEntitlements,
		syncDiscordRolesForEntitlements,
	],
}
