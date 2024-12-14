import { parseSubscriptionInfoFromCheckoutSession } from 'src/lib/pricing/stripe-subscription-utils'

import { parsePurchaseInfoFromCheckoutSession } from '../../lib/pricing/stripe-purchase-utils'
import { User } from '../../schemas'
import {
	CheckoutSessionCompletedEvent,
	checkoutSessionCompletedEvent,
} from '../../schemas/stripe/checkout-session-completed'
import { NEW_PURCHASE_CREATED_EVENT } from '../commerce/event-new-purchase-created'
import { NEW_SUBSCRIPTION_CREATED_EVENT } from '../commerce/event-new-subscription-created'
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

		const stripeEvent = checkoutSessionCompletedEvent.parse(
			event.data.stripeEvent,
		)
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

		if (checkoutSession.mode === 'payment') {
			// this could be a separate function that gets invoked here
			const purchaseInfo = await step.run(
				'parse checkout session',
				async () => {
					return await parsePurchaseInfoFromCheckoutSession(checkoutSession, db)
				},
			)

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

					return await db.createMerchantChargeAndPurchase({
						userId: user.id,
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
						upgradedFromPurchaseId:
							purchaseInfo.metadata?.upgradedFromPurchaseId,
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
				user,
			})

			return { purchase, purchaseInfo }
		}

		if (checkoutSession.mode === 'subscription') {
			const subscriptionInfo = await step.run(
				'parse checkout session for subscription',
				async () => {
					return await parseSubscriptionInfoFromCheckoutSession(checkoutSession)
				},
			)

			const { user, isNewUser } = await step.run('load the user', async () => {
				if (!subscriptionInfo.email) {
					throw new Error('subscriptionInfo.email is null')
				}
				return await db.findOrCreateUser(subscriptionInfo.email)
			})

			const organization = await step.run('load the organization', async () => {
				if (subscriptionInfo.metadata?.organizationId) {
					return await db.getOrganization(
						subscriptionInfo.metadata.organizationId,
					)
				}

				const memberships = await db.getMembershipsForUser(user.id)
				if (memberships.length === 1) {
					const organizationId = memberships[0].organizationId

					if (!organizationId) {
						throw new Error('organizationId is null')
					}
					return await db.getOrganization(organizationId)
				}

				if (memberships.length > 1) {
					throw new Error(
						'user has more than one organization and not specified in metadata',
					)
				}

				const personalOrganization = await db.createOrganization({
					name: `Personal (${user.email})`,
				})

				if (!personalOrganization) {
					throw new Error('Failed to create personal organization')
				}

				const membership = await db.addMemberToOrganization({
					organizationId: personalOrganization.id,
					userId: user.id,
					invitedById: user.id,
				})

				if (!membership) {
					throw new Error('Failed to add user to personal organization')
				}

				await db.addRoleForMember({
					organizationId: personalOrganization.id,
					memberId: membership.id,
					role: 'owner',
				})

				return personalOrganization
			})

			if (!organization) {
				throw new Error('organization is null')
			}

			await step.run('store the checkout session', async () => {
				await db.createMerchantSession({
					merchantAccountId: merchantAccount.id,
					identifier: stripeCheckoutSession.id,
					organizationId: organization.id,
				})
			})

			const merchantProduct = await step.run(
				'load the merchant product',
				async () => {
					if (!subscriptionInfo.productIdentifier) {
						throw new Error('subscriptionInfo.productIdentifier is null')
					}
					return await db.getMerchantProduct(subscriptionInfo.productIdentifier)
				},
			)

			const merchantCustomer = await step.run(
				'load the merchant customer',
				async () => {
					if (!subscriptionInfo.customerIdentifier) {
						throw new Error('subscriptionInfo.customerIdentifier is null')
					}
					return await db.findOrCreateMerchantCustomer({
						user: user as User,
						identifier: subscriptionInfo.customerIdentifier,
						merchantAccountId: merchantAccount.id,
					})
				},
			)

			if (!merchantCustomer) {
				throw new Error('merchantCustomer is null')
			}

			if (!merchantProduct) {
				throw new Error('merchantProduct is null')
			}

			const { subscription } = await step.run(
				'create a merchant subscription',
				async () => {
					const merchantSubscription = await db.createMerchantSubscription({
						merchantAccountId: merchantAccount.id,
						merchantCustomerId: merchantCustomer.id,
						merchantProductId: merchantProduct.id,
						identifier: subscriptionInfo.subscriptionIdentifier,
					})

					if (!merchantSubscription) {
						throw new Error('merchantSubscription is null')
					}

					const subscription = await db.createSubscription({
						merchantSubscriptionId: merchantSubscription.id,
						organizationId: organization.id,
						productId: merchantProduct.productId,
					})

					return { subscription, merchantSubscription }
				},
			)

			await step.run('give member learner role', async () => {
				if (!user) {
					throw new Error('user is null')
				}
				if (!organization) {
					throw new Error('organization is null')
				}

				const userMemberships = await db.getMembershipsForUser(user.id)

				const organizationMembership = userMemberships.find(
					(membership) => membership.organizationId === organization.id,
				)

				if (!organizationMembership) {
					throw new Error('organizationMembership is null')
				}

				await db.addRoleForMember({
					memberId: organizationMembership.id,
					organizationId: organization.id,
					role: 'learner',
				})
			})

			if (!subscription) {
				throw new Error('subscription is null')
			}

			await step.sendEvent(NEW_SUBSCRIPTION_CREATED_EVENT, {
				name: NEW_SUBSCRIPTION_CREATED_EVENT,
				data: {
					subscriptionId: subscription.id,
					checkoutSessionId: stripeCheckoutSession.id,
				},
				user,
			})

			return { subscription, subscriptionInfo }
		}
	}

export const stripeCheckoutSessionComplete = {
	config: stripeCheckoutSessionCompletedConfig,
	trigger: stripeCheckoutSessionCompletedTrigger,
	handler: stripeCheckoutSessionCompletedHandler,
}
