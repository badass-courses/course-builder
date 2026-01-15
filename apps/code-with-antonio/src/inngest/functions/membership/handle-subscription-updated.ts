import { inngest } from '@/inngest/inngest.server'
import {
	restoreEntitlementsForSubscription,
	softDeleteEntitlementsForSubscription,
	updateEntitlementExpirationForSubscription,
} from '@/lib/entitlements'

import { STRIPE_CUSTOMER_SUBSCRIPTION_UPDATED_EVENT } from '@coursebuilder/core/inngest/stripe/event-customer-subscription-updated'

/**
 * Handle Stripe subscription lifecycle events (status changes, renewals, cancellations).
 * This function manages entitlements based on subscription state changes.
 */
export const handleSubscriptionUpdated = inngest.createFunction(
	{
		id: 'handle-subscription-updated',
		name: 'Handle Subscription Updated',
	},
	{
		event: STRIPE_CUSTOMER_SUBSCRIPTION_UPDATED_EVENT,
	},
	async ({ event, step, db }) => {
		const stripeSubscription = event.data.stripeEvent.data.object
		const previousAttributes = event.data.stripeEvent.data.previous_attributes

		// Find our subscription record via Stripe subscription id
		const subscription = await step.run('find subscription', async () => {
			try {
				return await db.getSubscriptionForStripeId(stripeSubscription.id)
			} catch (error) {
				// Subscription might not exist in our system (created before this system)
				console.warn(
					`No subscription found for Stripe ID ${stripeSubscription.id}`,
					error,
				)
				return null
			}
		})

		if (!subscription) {
			return { skipped: true, reason: 'no_subscription_found' }
		}

		// Handle scheduled cancellation (cancel_at_period_end changed)
		// Status stays 'active' but user scheduled cancellation
		if (previousAttributes?.cancel_at_period_end !== undefined) {
			await step.run('handle scheduled cancellation', async () => {
				// Stripe timestamps are Unix seconds, Inngest may serialize to string
				const cancelAt = stripeSubscription.cancel_at
				const periodEnd = stripeSubscription.current_period_end

				if (stripeSubscription.cancel_at_period_end) {
					// User scheduled cancellation - set expiration to when access ends
					const ts = cancelAt ?? periodEnd
					if (!ts) {
						console.error('No cancel_at or current_period_end available')
						return { action: 'error', reason: 'missing_dates' }
					}
					const accessEndsAt =
						typeof ts === 'number' ? new Date(ts * 1000) : new Date(ts)

					await updateEntitlementExpirationForSubscription(
						subscription.id,
						accessEndsAt,
					)
					return { action: 'expiration_set_to_cancel_date', accessEndsAt }
				} else {
					// User reactivated (undid scheduled cancellation)
					if (!periodEnd) {
						console.error('No current_period_end available for reactivation')
						return { action: 'error', reason: 'missing_period_end' }
					}
					const newExpiration =
						typeof periodEnd === 'number'
							? new Date(periodEnd * 1000)
							: new Date(periodEnd)

					await restoreEntitlementsForSubscription(
						subscription.id,
						newExpiration,
					)
					return { action: 'cancellation_undone', newExpiration }
				}
			})
		}

		// Handle status changes
		if (previousAttributes?.status) {
			await step.run('update subscription status', async () => {
				// Update subscription status in database

				await db.updateSubscriptionStatus(
					subscription.id,
					stripeSubscription.status,
				)

				const canceledStatuses = [
					'canceled',
					'unpaid',
					'incomplete_expired',
					'paused',
				]
				const wasActive =
					previousAttributes.status === 'active' ||
					previousAttributes.status === 'trialing'

				// If subscription became inactive, soft delete entitlements
				if (canceledStatuses.includes(stripeSubscription.status)) {
					await softDeleteEntitlementsForSubscription(subscription.id)
					return { action: 'entitlements_soft_deleted' }
				}

				// If subscription was reactivated, restore entitlements
				if (
					stripeSubscription.status === 'active' &&
					canceledStatuses.includes(previousAttributes.status as string)
				) {
					// Handle both number (unix timestamp) and string date formats
					const periodEnd = stripeSubscription.current_period_end
					const newExpiration = periodEnd
						? typeof periodEnd === 'number'
							? new Date(periodEnd * 1000)
							: new Date(periodEnd)
						: undefined

					if (newExpiration && !isNaN(newExpiration.getTime())) {
						await restoreEntitlementsForSubscription(
							subscription.id,
							newExpiration,
						)
						return { action: 'entitlements_restored' }
					}
				}

				return { action: 'status_updated_no_entitlement_change' }
			})
		}

		// Handle renewal (period end changed = billing cycle renewed)
		if (previousAttributes?.current_period_end && !previousAttributes?.status) {
			await step.run('extend entitlement expiration', async () => {
				const periodEnd = stripeSubscription.current_period_end
				if (!periodEnd) {
					console.error('No current_period_end in renewal event')
					return { action: 'error', reason: 'missing_period_end' }
				}

				// Handle both number (unix timestamp) and string date formats
				const newExpiration =
					typeof periodEnd === 'number'
						? new Date(periodEnd * 1000)
						: new Date(periodEnd)

				if (isNaN(newExpiration.getTime())) {
					console.error('Invalid renewal date', {
						current_period_end: periodEnd,
					})
					return { action: 'error', reason: 'invalid_date' }
				}

				await updateEntitlementExpirationForSubscription(
					subscription.id,
					newExpiration,
				)
				return { newExpiration }
			})
		}

		return {
			subscriptionId: subscription.id,
			stripeStatus: stripeSubscription.status,
		}
	},
)
