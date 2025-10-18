import { PROVIDERS } from 'src/constants'

import { parsePurchaseInfoFromCheckoutSession } from '../../lib/pricing/stripe-purchase-utils'
import { User } from '../../schemas'
import {
	CheckoutSessionCompletedEvent,
	checkoutSessionCompletedEvent,
} from '../../schemas/stripe/checkout-session-completed'
import { NEW_PURCHASE_CREATED_EVENT } from '../commerce/event-new-purchase-created'
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
	idempotency: 'event.data.stripeEvent.data.object.id',
}

export const stripeCheckoutSessionCompletedTrigger: CoreInngestTrigger = {
	event: STRIPE_CHECKOUT_SESSION_COMPLETED_EVENT,
	if: "event.data.stripeEvent.data.object.mode == 'payment'",
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

		const stripeEvent = checkoutSessionCompletedEvent.parse(
			event.data.stripeEvent,
		)
		const paymentsAdapter = paymentProvider.options.paymentsAdapter
		const stripeCheckoutSession = stripeEvent.data.object

		const merchantAccount = await step.run(
			'load the merchant account',
			async () => {
				return await db.getMerchantAccount({
					provider: PROVIDERS.STRIPE,
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

		const organizationId = checkoutSession.metadata?.organizationId

		// this could be a separate function that gets invoked here
		const purchaseInfo = await step.run('parse checkout session', async () => {
			return await parsePurchaseInfoFromCheckoutSession(checkoutSession, db)
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

		const product = await step.run('load the product', async () => {
			if (!merchantProduct?.productId) {
				throw new Error('merchantProduct.productId is null')
			}
			return await db.getProduct(merchantProduct.productId)
		})

		const purchase = await step.run(
			'create a merchant charge and purchase',
			async () => {
				if (!merchantProduct) {
					throw new Error('merchantProduct is null')
				}
				if (!merchantCustomer) {
					throw new Error('merchantCustomer is null')
				}

				return await db.createMerchantChargeAndPurchase({
					userId: user.id,
					organizationId,
					productId: merchantProduct.productId,
					stripeChargeId: purchaseInfo.chargeIdentifier,
					stripeCouponId: purchaseInfo.couponIdentifier,
					merchantAccountId: merchantAccount.id,
					merchantProductId: merchantProduct.id,
					merchantCustomerId: merchantCustomer.id,
					stripeChargeAmount: purchaseInfo.chargeAmount,
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
				productType: product?.type || 'self-paced',
			},
			user,
		})

		return { purchase, purchaseInfo }
	}

export const stripeCheckoutSessionComplete = {
	config: stripeCheckoutSessionCompletedConfig,
	trigger: stripeCheckoutSessionCompletedTrigger,
	handler: stripeCheckoutSessionCompletedHandler,
}
