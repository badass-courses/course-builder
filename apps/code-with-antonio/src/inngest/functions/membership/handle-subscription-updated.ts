import { db as drizzleDb } from '@/db'
import { subscription as subscriptionTable } from '@/db/schema'
import { env } from '@/env.mjs'
import { inngest } from '@/inngest/inngest.server'
import { removeDiscordRole } from '@/lib/discord-utils'
import {
	restoreEntitlementsForSubscription,
	softDeleteEntitlementsForSubscription,
	updateEntitlementExpirationForSubscription,
} from '@/lib/entitlements'
import {
	TeamSubscriptionFieldsSchema,
	type TeamSubscriptionFields,
} from '@/lib/team-subscriptions'
import { log } from '@/server/logger'
import { eq } from 'drizzle-orm'
import type Stripe from 'stripe'
import { z } from 'zod'

import { STRIPE_CUSTOMER_SUBSCRIPTION_UPDATED_EVENT } from '@coursebuilder/core/inngest/stripe/event-customer-subscription-updated'

/**
 * Schema for parsing Stripe subscription item data within previousAttributes.
 * Stripe nests period information inside items when they change during renewal.
 */
const stripeSubscriptionItemSchema = z.object({
	current_period_end: z.number().optional(),
	current_period_start: z.number().optional(),
	quantity: z.number().optional(),
})

/**
 * Schema for parsing previousAttributes from Stripe webhook events.
 * This captures the fields we care about for subscription lifecycle management.
 */
const previousAttributesSchema = z
	.object({
		current_period_end: z.number().optional(),
		cancel_at_period_end: z.boolean().optional(),
		status: z.string().optional(),
		quantity: z.number().optional(),
		items: z
			.object({
				data: z.array(stripeSubscriptionItemSchema),
			})
			.optional(),
	})
	.passthrough()
	.optional()

type PreviousAttributes = z.infer<typeof previousAttributesSchema>

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
	async ({ event, step, db, paymentProvider }) => {
		const stripeSubscription = event.data.stripeEvent.data.object

		// Parse previousAttributes with zod for type-safe access
		const parsedPrevAttrs = previousAttributesSchema.safeParse(
			event.data.stripeEvent.data.previous_attributes,
		)
		const previousAttributes = parsedPrevAttrs.success
			? parsedPrevAttrs.data
			: undefined

		// Find our subscription record via Stripe subscription id
		const subscription = await step.run('find subscription', async () => {
			try {
				return await db.getSubscriptionForStripeId(stripeSubscription.id)
			} catch (error) {
				// Subscription might not exist in our system (created before this system)
				log.warn('subscription_not_found_for_stripe_id', {
					stripeSubscriptionId: stripeSubscription.id,
					error,
				})
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
						log.error('subscription_missing_cancel_dates', {
							subscriptionId: subscription.id,
							stripeSubscriptionId: stripeSubscription.id,
						})
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
						log.error('subscription_missing_period_end_for_reactivation', {
							subscriptionId: subscription.id,
							stripeSubscriptionId: stripeSubscription.id,
						})
						return { action: 'error', reason: 'missing_period_end' }
					}
					const newExpiration =
						typeof periodEnd === 'number'
							? new Date(periodEnd * 1000)
							: new Date(periodEnd)

					await updateEntitlementExpirationForSubscription(
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

				// If subscription became inactive, soft delete entitlements and remove Discord role
				if (canceledStatuses.includes(stripeSubscription.status)) {
					await softDeleteEntitlementsForSubscription(subscription.id)

					// Remove Discord subscriber role
					if (env.DISCORD_SUBSCRIBER_ROLE_ID) {
						const subWithOwner = await drizzleDb.query.subscription.findFirst({
							where: eq(subscriptionTable.id, subscription.id),
						})
						const fieldsParsed = TeamSubscriptionFieldsSchema.safeParse(
							subWithOwner?.fields,
						)
						const ownerId = fieldsParsed.success
							? fieldsParsed.data.ownerId
							: undefined

						if (ownerId) {
							const discordResult = await removeDiscordRole(
								ownerId,
								env.DISCORD_SUBSCRIBER_ROLE_ID,
							)
							await log.info('subscription_discord_role_removed', {
								subscriptionId: subscription.id,
								ownerId,
								discordResult,
							})
						}
					}

					return { action: 'entitlements_soft_deleted' }
				}

				// If subscription was reactivated, restore entitlements
				const previousStatus = previousAttributes?.status
				if (
					stripeSubscription.status === 'active' &&
					previousStatus &&
					canceledStatuses.includes(previousStatus)
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
		// Check both top-level and nested in items (Stripe can put it either place)
		const topLevelPeriodEndChanged = previousAttributes?.current_period_end
		const nestedPeriodEndChanged =
			previousAttributes?.items?.data?.[0]?.current_period_end

		if (
			(topLevelPeriodEndChanged || nestedPeriodEndChanged) &&
			!previousAttributes?.status
		) {
			await step.run('extend entitlement expiration', async () => {
				// Stripe webhook events often have partial objects, fetch the full subscription
				let periodEnd: number | undefined =
					stripeSubscription.current_period_end

				if (!periodEnd) {
					// Fetch from Stripe API to get the actual current_period_end
					try {
						const freshSubscription: Stripe.Subscription =
							await paymentProvider.getSubscription(stripeSubscription.id)
						periodEnd = freshSubscription.current_period_end
					} catch (error) {
						log.error('subscription_stripe_fetch_failed', {
							subscriptionId: subscription.id,
							stripeSubscriptionId: stripeSubscription.id,
							error,
						})
					}
				}

				if (!periodEnd) {
					log.error('subscription_missing_period_end_after_fetch', {
						subscriptionId: subscription.id,
						stripeSubscriptionId: stripeSubscription.id,
					})
					return { action: 'error', reason: 'missing_period_end' }
				}

				// Stripe timestamps are always unix seconds
				const newExpiration = new Date(periodEnd * 1000)

				await updateEntitlementExpirationForSubscription(
					subscription.id,
					newExpiration,
				)
				return { newExpiration }
			})
		}

		// Handle seat quantity changes (items or quantity changed)
		// This happens when subscription quantity is updated in Stripe
		if (previousAttributes?.items || previousAttributes?.quantity) {
			await step.run('sync seat count', async () => {
				const stripeSubId = stripeSubscription.id

				// Fetch existing subscription FIRST so fields can be used as fallback
				const existingSub = await drizzleDb.query.subscription.findFirst({
					where: eq(subscriptionTable.id, subscription.id),
				})

				const fieldsParsed = TeamSubscriptionFieldsSchema.safeParse(
					existingSub?.fields,
				)

				// Defensive check - ensure we have valid fields with ownerId
				if (!fieldsParsed.success) {
					log.warn('subscription_missing_fields', {
						subscriptionId: subscription.id,
						fields: existingSub?.fields,
						errors: fieldsParsed.error.errors,
					})
					return { action: 'skipped_invalid_fields' }
				}

				const currentFields = fieldsParsed.data
				let newQuantity: number | undefined

				// Layer 1: Try fresh fetch from Stripe API
				try {
					const freshStripeSubscription: Stripe.Subscription =
						await paymentProvider.getSubscription(stripeSubId)
					// For per-seat subscriptions, quantity is on the first line item
					const itemQuantity = freshStripeSubscription.items.data[0]?.quantity
					newQuantity = itemQuantity

					if (newQuantity !== undefined) {
						log.info('subscription_seat_sync_from_stripe', {
							subscriptionId: subscription.id,
							stripeSubId,
							itemQuantity,
							newQuantity,
						})
					}
				} catch (error) {
					log.error('subscription_seat_sync_stripe_fetch_failed', {
						subscriptionId: subscription.id,
						stripeSubId,
						error,
					})
				}

				// Layer 2: Fall back to previousAttributes from webhook event
				if (newQuantity === undefined) {
					const prevAttrQuantity =
						previousAttributes?.quantity ??
						previousAttributes?.items?.data?.[0]?.quantity

					if (prevAttrQuantity !== undefined) {
						newQuantity = prevAttrQuantity
						log.info('subscription_seat_sync_from_previous_attributes', {
							subscriptionId: subscription.id,
							stripeSubId,
							newQuantity,
							source:
								previousAttributes?.quantity !== undefined
									? 'quantity'
									: 'items',
						})
					}
				}

				// Layer 3: Fall back to existing subscription fields (currentFields.seats)
				if (newQuantity === undefined && currentFields.seats !== undefined) {
					newQuantity = currentFields.seats
					log.info('subscription_seat_sync_from_existing_fields', {
						subscriptionId: subscription.id,
						stripeSubId,
						newQuantity,
					})
				}

				// Layer 4: Last resort default to 1
				if (newQuantity === undefined) {
					newQuantity = 1
					log.warn('subscription_seat_sync_fallback_to_default', {
						subscriptionId: subscription.id,
						stripeSubId,
						newQuantity,
					})
				}

				const updatedFields: TeamSubscriptionFields = {
					...currentFields,
					seats: newQuantity,
				}

				await drizzleDb
					.update(subscriptionTable)
					.set({ fields: updatedFields })
					.where(eq(subscriptionTable.id, subscription.id))

				return { action: 'seats_updated', newQuantity }
			})
		}

		return {
			subscriptionId: subscription.id,
			stripeStatus: stripeSubscription.status,
		}
	},
)
