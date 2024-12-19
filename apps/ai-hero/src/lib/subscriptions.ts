import { courseBuilderAdapter, db } from '@/db'

import { SubscriptionSchema } from '@coursebuilder/core/schemas/subscription'

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
