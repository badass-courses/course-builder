import { db } from '@/db'
import {
	contentResourceResource,
	entitlements,
	entitlementTypes,
} from '@/db/schema'
import { inngest } from '@/inngest/inngest.server'
import { getCohort } from '@/lib/cohorts-query'
import { and, eq } from 'drizzle-orm'

import { guid } from '@coursebuilder/adapter-drizzle/mysql'
import { FULL_PRICE_COUPON_REDEEMED_EVENT } from '@coursebuilder/core/inngest/commerce/event-full-price-coupon-redeemed'
import { NEW_PURCHASE_CREATED_EVENT } from '@coursebuilder/core/inngest/commerce/event-new-purchase-created'

export const postCohortPurchaseWorkflow = inngest.createFunction(
	{
		id: `post-cohort-purchase-workflow`,
		name: `Post Cohort Purchase Followup Workflow`,
	},
	[
		{
			event: NEW_PURCHASE_CREATED_EVENT,
			if: 'event.data.productType == "cohort"',
		},
		{
			event: FULL_PRICE_COUPON_REDEEMED_EVENT,
			if: 'event.data.productType == "cohort"',
		},
	],
	async ({ event, step, db: adapter }) => {
		const purchase = await step.run(`get purchase`, async () => {
			return adapter.getPurchase(event.data.purchaseId)
		})

		if (!purchase) {
			throw new Error(`purchase not found`)
		}

		const product = await step.run(`get product`, async () => {
			return adapter.getProduct(purchase.productId as string)
		})

		console.log(`product`, product)

		if (!product) {
			throw new Error(`product not found`)
		}

		const user = await step.run(`get user`, async () => {
			return adapter.getUserById(purchase.userId as string)
		})

		if (!user) {
			throw new Error(`user not found`)
		}

		const isTeamPurchase = Boolean(purchase.bulkCouponId)

		// the cohort should be part of the product resources
		const cohortResourceId = product.resources?.find(
			(resource) => resource.resource?.type === 'cohort',
		)?.resource.id

		const cohortResource = await step.run(`get cohort resource`, async () => {
			return getCohort(cohortResourceId)
		})

		if (isTeamPurchase) {
			// send an email to the purchaser explaining next steps
		} else {
			if (['Valid', 'Restricted'].includes(purchase.status)) {
				const cohortContentAccessEntitlementType = await step.run(
					`get cohort content access entitlement type`,
					async () => {
						return await db.query.entitlementTypes.findFirst({
							where: eq(entitlementTypes.name, 'cohort_content_access'),
						})
					},
				)

				const cohortDiscordRoleEntitlementType = await step.run(
					`get cohort discord role entitlement type`,
					async () => {
						return await db.query.entitlementTypes.findFirst({
							where: eq(entitlementTypes.name, 'cohort_discord_role'),
						})
					},
				)

				const orgMembership = await step.run(`get org membership`, async () => {
					if (!purchase.organizationId) {
						throw new Error(`purchase.organizationId is required`)
					}
					const orgMembership = await adapter.addMemberToOrganization({
						organizationId: purchase.organizationId,
						userId: user.id,
						invitedById: user.id,
					})

					if (!orgMembership) {
						throw new Error(`orgMembership is required`)
					}

					await adapter.addRoleForMember({
						organizationId: purchase.organizationId,
						memberId: orgMembership.id,
						role: 'learner',
					})

					return orgMembership
				})

				if (cohortContentAccessEntitlementType && cohortResource?.resources) {
					await step.run(`add user to cohort via entitlement`, async () => {
						for (const resource of cohortResource.resources || []) {
							const entitlementId = `${resource.resource.id}-${guid()}`
							await db.insert(entitlements).values({
								id: entitlementId,
								entitlementType: cohortContentAccessEntitlementType.id,
								sourceType: 'cohort',
								sourceId: resource.resource.id,
								userId: user.id,
								organizationId: purchase.organizationId,
								organizationMembershipId: orgMembership.id,
								metadata: {
									contentIds: [resource.resource.id],
								},
							})
						}
					})
				}
			} else {
				// send a slack message or something because it seems broken
			}
		}

		return {
			purchase,
			product,
			user,
			cohortResource,
			isTeamPurchase,
		}
	},
)

const getContentIdsForTier = async (
	cohortResourceId: string,
	purchasedTier: 'standard' | 'premium' | 'vip',
) => {
	const allowedTiers = {
		standard: ['standard'],
		premium: ['standard', 'premium'],
		vip: ['standard', 'premium', 'vip'],
	}
	// Determine which tiers are allowed based on the purchased tier
	const allowedTierList = allowedTiers[purchasedTier] || ['standard'] // Default to standard

	const accessibleContent = await db.query.contentResourceResource.findMany({
		where: and(eq(contentResourceResource.resourceOfId, cohortResourceId)),
		with: {
			resource: true, // Fetch the related content resource
		},
	})

	// Filter based on metadata.tier
	const filteredContent = accessibleContent.filter((entry) => {
		const resourceTier = entry.metadata?.tier || 'standard' // Default to 'standard' if not set
		return allowedTierList.includes(resourceTier)
	})

	return filteredContent.map((entry) => entry.resource.id)
}
