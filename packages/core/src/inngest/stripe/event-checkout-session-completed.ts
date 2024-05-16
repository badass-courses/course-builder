import { NodemailerConfig } from '@auth/core/providers/nodemailer'

import { sendServerEmail } from '../../lib/send-server-email'
import { parseCheckoutSession } from '../../providers/stripe'
import { User } from '../../schemas'
import { CheckoutSessionCompletedEvent } from '../../schemas/stripe/checkout-session-completed'
import { NEW_PURCHASE_CREATED_EVENT } from '../commerce/event-new-purchase-created'
import {
	sendPostPurchaseEmailConfig,
	sendPostPurchaseEmailHandler,
	sendPostPurchaseEmailTrigger,
} from '../commerce/send-post-purchase-email'
import {
	CoreInngestFunctionInput,
	CoreInngestHandler,
	CoreInngestTrigger,
} from '../create-inngest-middleware'

export const STRIPE_CHECKOUT_SESSION_COMPLETED_EVENT =
	'stripe/checkout-session-completed'

export type StripeCheckoutSessionCompleted = {
	name: typeof STRIPE_CHECKOUT_SESSION_COMPLETED_EVENT
	data: {
		stripeEvent: CheckoutSessionCompletedEvent
	}
}

export const stripeCheckoutSessionCompletedConfig = {
	id: 'stripe-checkout-session-completed',
	name: 'Stripe Checkout Session Completed',
}

export const stripeCheckoutSessionCompletedTrigger: CoreInngestTrigger = {
	event: STRIPE_CHECKOUT_SESSION_COMPLETED_EVENT,
}

export const stripeCheckoutSessionCompletedHandler: CoreInngestHandler =
	async ({
		event,
		step,
		db,
		siteRootUrl,
		paymentProvider,
		emailProvider,
		getAuthConfig,
	}: CoreInngestFunctionInput) => {
		// break down the checkout session into the info we need

		// recordNewPurchase(event.data.object.id)
		// 	getPurchaseInfo - load the details of the purchase from stripe
		//  find or create a user
		//  load the merchant product from the database
		//  find or create the merchant customer in the database
		//  create a merchant charge and purchase in the database

		const stripeEvent = event.data.stripeEvent
		const paymentsAdapter = paymentProvider.options.paymentsAdapter
		const stripeCheckoutSession = stripeEvent.data.object

		const merchantAccount = await step.run(
			'load the merchant account',
			async () => {
				return await db.getMerchantAccount({
					provider: 'stripe',
				})
			},
		)

		if (!merchantAccount) {
			throw new Error('Merchant account not found')
		}

		const checkoutSession = await step.run(
			'get stripe checkout session',
			async () => {
				return await paymentsAdapter.getCheckoutSession(
					stripeCheckoutSession.id,
				)
			},
		)

		const purchaseInfo = await step.run('parse checkout session', async () => {
			return await parseCheckoutSession(checkoutSession, db)
		})

		const { user, isNewUser } = await step.run('load the user', async () => {
			if (!purchaseInfo.email) {
				throw new Error('purchaseInfo.email is null')
			}
			return await db.findOrCreateUser(purchaseInfo.email)
		})

		const merchantProduct = await step.run(
			'load the merchant product',
			async () => {
				if (!purchaseInfo.productIdentifier) {
					throw new Error('purchaseInfo.productIdentifier is null')
				}
				return await db.getMerchantProduct(purchaseInfo.productIdentifier)
			},
		)

		const merchantCustomer = await step.run(
			'load the merchant customer',
			async () => {
				if (!purchaseInfo.customerIdentifier) {
					throw new Error('purchaseInfo.customerIdentifier is null')
				}
				return await db.findOrCreateMerchantCustomer({
					user: user as User,
					identifier: purchaseInfo.customerIdentifier,
					merchantAccountId: merchantAccount.id,
				})
			},
		)

		const purchase = await step.run(
			'create a merchant charge and purchase',
			async () => {
				if (!merchantProduct) {
					throw new Error('merchantProduct is null')
				}
				if (!merchantCustomer) {
					throw new Error('merchantCustomer is null')
				}
				if (!purchaseInfo.chargeIdentifier) {
					throw new Error('purchaseInfo.chargeIdentifier is null')
				}
				return await db.createMerchantChargeAndPurchase({
					userId: user.id,
					productId: merchantProduct.productId,
					stripeChargeId: purchaseInfo.chargeIdentifier,
					stripeCouponId: purchaseInfo.couponIdentifier,
					merchantAccountId: merchantAccount.id,
					merchantProductId: merchantProduct.id,
					merchantCustomerId: merchantCustomer.id,
					stripeChargeAmount: purchaseInfo.chargeAmount || 0,
					quantity: purchaseInfo.quantity,
					checkoutSessionId: stripeCheckoutSession.id,
					country: purchaseInfo.metadata?.country,
					appliedPPPStripeCouponId:
						purchaseInfo.metadata?.appliedPPPStripeCouponId,
					upgradedFromPurchaseId: purchaseInfo.metadata?.upgradedFromPurchaseId,
					usedCouponId: purchaseInfo.metadata?.usedCouponId,
				})
			},
		)

		await step.sendEvent(NEW_PURCHASE_CREATED_EVENT, {
			name: NEW_PURCHASE_CREATED_EVENT,
			data: {
				purchaseId: purchase.id,
				checkoutSessionId: stripeCheckoutSession.id,
			},
		})

		return { purchase, purchaseInfo }
	}

export const stripeCheckoutSessionComplete = {
	config: stripeCheckoutSessionCompletedConfig,
	trigger: stripeCheckoutSessionCompletedTrigger,
	handler: stripeCheckoutSessionCompletedHandler,
}
