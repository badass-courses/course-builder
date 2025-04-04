import { inngest } from '@/inngest/inngest.server'

import { NEW_SUBSCRIPTION_CREATED_EVENT } from '@coursebuilder/core/inngest/commerce/event-new-subscription-created'
import { STRIPE_CHECKOUT_SESSION_COMPLETED_EVENT } from '@coursebuilder/core/inngest/stripe/event-checkout-session-completed'
import { parseSubscriptionInfoFromCheckoutSession } from '@coursebuilder/core/lib/pricing/stripe-subscription-utils'
import { User } from '@coursebuilder/core/schemas'
import { checkoutSessionCompletedEvent } from '@coursebuilder/core/schemas/stripe/checkout-session-completed'

export const stripeSubscriptionCheckoutSessionComplete = inngest.createFunction(
	{
		id: 'stripe-subscription-checkout-session-completed',
		name: 'Stripe Subscription Checkout Session Completed',
	},
	{
		event: STRIPE_CHECKOUT_SESSION_COMPLETED_EVENT,
		if: "event.data.stripeEvent.data.object.mode == 'subscription'",
	},
	async ({ event, step, db, paymentProvider }) => {
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
				if (
					subscriptionInfo.metadata?.organizationId &&
					subscriptionInfo.metadata?.organizationId !== 'undefined'
				) {
					return await db.getOrganization(
						subscriptionInfo.metadata.organizationId,
					)
				}

				const memberships = await db.getMembershipsForUser(user.id)
				if (memberships.length === 1) {
					const organizationId = memberships[0]?.organizationId

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
	},
)
