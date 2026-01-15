import { courseBuilderAdapter, db } from '@/db'

import {
	Subscription,
	SubscriptionSchema,
} from '@coursebuilder/core/schemas/subscription'

/**
 * Checks if a user has an active subscription through any of their memberships.
 * @param userId - The user's ID to check subscription status for
 * @returns Object containing hasActiveSubscription boolean
 */
export async function getSubscriptionStatus(userId?: string) {
	if (!userId) {
		return {
			hasActiveSubscription: false,
		}
	}
	const memberships = await courseBuilderAdapter.getMembershipsForUser(userId)
	let hasActiveSubscription = false
	for (const membership of memberships) {
		if (!membership.organizationId) continue
		const organization = await courseBuilderAdapter.getOrganization(
			membership.organizationId,
		)
		if (!organization) continue
		const membershipSubscriptions = await db.query.subscription.findMany({
			where: (subscription, { eq, and }) =>
				and(
					eq(subscription.organizationId, organization.id),
					eq(subscription.status, 'active'),
				),
		})
		if (membershipSubscriptions.length > 0) {
			hasActiveSubscription = true
			break
		}
	}

	return { hasActiveSubscription }
}

/**
 * Fetches a subscription by ID with product and merchant subscription details.
 * @param subscriptionId - The subscription ID to fetch
 * @returns Parsed subscription object
 */
export async function getSubscription(subscriptionId: string) {
	const subscription = await db.query.subscription.findFirst({
		where: (subscription, { eq }) => eq(subscription.id, subscriptionId),
		with: {
			product: true,
			merchantSubscription: true,
		},
	})

	return SubscriptionSchema.parse(subscription)
}

/**
 * Gets the user's active subscription through their organization memberships.
 * Returns the first active subscription found, along with the organization ID.
 * @param userId - The user's ID to get subscription for
 * @returns Object with subscription (if active) and organizationId, or null values if none found
 */
export async function getUserActiveSubscription(userId?: string): Promise<{
	subscription: Subscription | null
	organizationId: string | null
}> {
	if (!userId) {
		return { subscription: null, organizationId: null }
	}

	const memberships = await courseBuilderAdapter.getMembershipsForUser(userId)

	for (const membership of memberships) {
		if (!membership.organizationId) continue

		const organization = await courseBuilderAdapter.getOrganization(
			membership.organizationId,
		)
		if (!organization) continue

		const activeSubscription = await db.query.subscription.findFirst({
			where: (subscription, { eq, and }) =>
				and(
					eq(subscription.organizationId, organization.id),
					eq(subscription.status, 'active'),
				),
			with: {
				product: true,
				merchantSubscription: true,
			},
		})

		if (activeSubscription) {
			return {
				subscription: SubscriptionSchema.parse(activeSubscription),
				organizationId: organization.id,
			}
		}
	}

	return { subscription: null, organizationId: null }
}
