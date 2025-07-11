import { imageResourceCreated } from '@/inngest/functions/cloudinary/image-resource-created'
import { addPurchasesConvertkit } from '@/inngest/functions/convertkit/add-purchased-convertkit'
import { addSubscriptionRoleDiscord } from '@/inngest/functions/discord/add-purchase-role-discord'
import { discordAccountLinked } from '@/inngest/functions/discord/discord-account-linked'
import { removePurchaseRoleDiscord } from '@/inngest/functions/discord/remove-purchase-role-discord'
import { emailSendBroadcast } from '@/inngest/functions/email-send-broadcast'
import { userSignupAdminEmail } from '@/inngest/functions/notify/creator/user-signup'
import { performCodeExtraction } from '@/inngest/functions/ocr/ocr-code-extractor'
import { sendWelcomeEmail } from '@/inngest/functions/post-purchase-automation/send-welcome-email'
import { postmarkWebhook } from '@/inngest/functions/postmark/postmarks-webhooks-handler'
import { syncPurchaseTags } from '@/inngest/functions/sync-purchase-tags'
import { userCreated } from '@/inngest/functions/user-created'
import { inngest } from '@/inngest/inngest.server'

import { courseBuilderCoreFunctions } from '@coursebuilder/core/inngest'

import {
	calendarSync,
	handleRefundAndRemoveFromCalendar,
} from './functions/calendar-sync'
import { getOrCreateConcept } from './functions/concepts/get-or-create-tag'
import { createUserOrganizations } from './functions/create-user-organization'
import { postCohortPurchaseWorkflow } from './functions/post-cohort-purchase-workflow'
import { postEventPurchase } from './functions/post-event-purchase'
import { computeVideoSplitPoints } from './functions/split_video'
import { stripeSubscriptionCheckoutSessionComplete } from './functions/stripe/event-subscription-checkout-session-completed'
import { unlistPastEvents } from './functions/unlist-past-events'
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
		postCohortPurchaseWorkflow,
		syncPurchaseTags,
		addPurchasesConvertkit,
		stripeSubscriptionCheckoutSessionComplete,
		createUserOrganizations,
		videoResourceAttached,
		videoResourceDetached,
		sendWelcomeEmail,
		calendarSync,
		postEventPurchase,
		handleRefundAndRemoveFromCalendar,
		unlistPastEvents,
	],
}
