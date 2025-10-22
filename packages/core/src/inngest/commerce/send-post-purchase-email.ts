import { NonRetriableError } from 'inngest'

import { sendServerEmail } from '../../lib/send-server-email'
import {
	CoreInngestFunctionInput,
	CoreInngestHandler,
	CoreInngestTrigger,
} from '../create-inngest-middleware'
import { NEW_PURCHASE_CREATED_EVENT } from './event-new-purchase-created'

export const sendPostPurchaseEmailConfig = {
	id: `send-post-purchase-email`,
	name: 'Send Post Purchase Email',
	idempotency: 'event.data.checkoutSessionId',
}
export const sendPostPurchaseEmailTrigger: CoreInngestTrigger = {
	event: NEW_PURCHASE_CREATED_EVENT,
}
export const sendPostPurchaseEmailHandler: CoreInngestHandler = async ({
	event,
	step,
	db,
	siteRootUrl,
	emailProvider,
	getAuthConfig,
}: CoreInngestFunctionInput) => {
	const purchase = await step.run('Load Purchase', async () => {
		return db.getPurchase(event.data.purchaseId)
	})

	if (!purchase || !purchase.userId) {
		throw new NonRetriableError('Purchase not found')
	}

	const user = await step.run('Load User', async () => {
		if (!purchase.userId) {
			throw new NonRetriableError('No user id for purchase.')
		}
		return db.getUserById(purchase.userId)
	})

	if (!user) {
		throw new NonRetriableError('User not found')
	}

	return await step.run('send customer email', async () => {
		return await sendServerEmail({
			email: user.email as string,
			callbackUrl: `${siteRootUrl}/welcome?purchaseId=${purchase.id}`,
			baseUrl: siteRootUrl,
			authOptions: getAuthConfig(),
			emailProvider: emailProvider,
			adapter: db,
			merchantChargeId: purchase.merchantChargeId,
			type: 'purchase',
		})
	})
}

export const sendPostPurchaseEmail = {
	config: sendPostPurchaseEmailConfig,
	trigger: sendPostPurchaseEmailTrigger,
	handler: sendPostPurchaseEmailHandler,
}
