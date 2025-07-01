import { db } from '@/db'
import {
	contentResourceResource,
	entitlements,
	entitlementTypes,
} from '@/db/schema'
import { env } from '@/env.mjs'
import { inngest } from '@/inngest/inngest.server'
import { getCohortWelcomeEmailVariant } from '@/inngest/utils/get-cohort-welcome-email-variant'
import { getCohort } from '@/lib/cohorts-query'
import { createCohortEntitlement } from '@/lib/entitlements'
import { ensurePersonalOrganizationWithLearnerRole } from '@/lib/personal-organization-service'
import { log } from '@/server/logger'
import { sendAnEmail } from '@/utils/send-an-email'
import { addDays, format } from 'date-fns'
import { and, eq } from 'drizzle-orm'

import { guid } from '@coursebuilder/adapter-drizzle/mysql'
import { FULL_PRICE_COUPON_REDEEMED_EVENT } from '@coursebuilder/core/inngest/commerce/event-full-price-coupon-redeemed'
import { NEW_PURCHASE_CREATED_EVENT } from '@coursebuilder/core/inngest/commerce/event-new-purchase-created'

import { USER_ADDED_TO_COHORT_EVENT } from './discord/add-cohort-role-discord'

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
		const isFullPriceCouponRedemption = Boolean(purchase.redeemedBulkCouponId)

		// Get information about the original bulk purchase if this is a coupon redemption
		const bulkCouponData = await step.run(`get bulk coupon data`, async () => {
			if (isFullPriceCouponRedemption && purchase.redeemedBulkCouponId) {
				const couponWithBulkPurchases =
					await adapter.getCouponWithBulkPurchases(
						purchase.redeemedBulkCouponId,
					)

				// The original bulk purchase should be in the bulkPurchases array
				const originalBulkPurchase = couponWithBulkPurchases?.bulkPurchases?.[0]

				return {
					coupon: couponWithBulkPurchases,
					originalBulkPurchase,
				}
			}
			return null
		})

		// the cohort should be part of the product resources
		const cohortResourceId = product.resources?.find(
			(resource) => resource.resource?.type === 'cohort',
		)?.resource.id

		const cohortResource = await step.run(`get cohort resource`, async () => {
			return getCohort(cohortResourceId)
		})

		if (!cohortResource) {
			throw new Error(`cohort resource not found`)
		}

		const dayOneStartsAt = cohortResource.resources?.find(
			(resource) => resource.position === 1,
		)?.resource?.fields?.startsAt
		const dayOneUnlockDate = dayOneStartsAt
			? format(new Date(dayOneStartsAt), 'MMMM do, yyyy')
			: 'TBD'

		if (isTeamPurchase) {
			const bulkCoupon = await step.run('get bulk coupon', async () => {
				if (purchase.bulkCouponId) {
					return adapter.getCoupon(purchase.bulkCouponId)
				}
				return null
			})

			await step.run(`send welcome email to team purchaser`, async () => {
				const dayZeroWorkshop = cohortResource.resources?.find(
					(resource) => resource.position === 0,
				)?.resource
				const dayZeroSlug = dayZeroWorkshop.fields?.slug
				const dayZeroUrl = `${env.COURSEBUILDER_URL}/workshops/${dayZeroSlug}`

				await sendAnEmail({
					Component: getCohortWelcomeEmailVariant({
						isTeamPurchase: true,
						isFullPriceCouponRedemption,
					}),
					componentProps: {
						cohortTitle:
							cohortResource.fields.title || cohortResource.fields.slug,
						url: dayZeroUrl,
						dayOneUnlockDate,
						quantity: bulkCoupon?.maxUses || 1,
						userFirstName: user.name?.split(' ')[0],
					},
					Subject: `Welcome to ${cohortResource.fields.title || 'AI Hero'}!`,
					To: user.email,
					ReplyTo: env.NEXT_PUBLIC_SUPPORT_EMAIL,
					From: env.NEXT_PUBLIC_SUPPORT_EMAIL,
					type: 'transactional',
				})

				await log.info('cohort_welcome_email.sent', {
					purchaseId: purchase.id,
					emailType: 'team_purchaser',
				})
			})
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

				// Ensure user has organization membership - either from purchase org or personal org
				const { organizationId, orgMembership } = await step.run(
					`ensure org membership`,
					async () => {
						// Determine who invited this user - for full price coupon redemptions,
						// it should be the original bulk purchaser
						const invitedById =
							isFullPriceCouponRedemption &&
							bulkCouponData?.originalBulkPurchase?.userId
								? bulkCouponData.originalBulkPurchase.userId
								: user.id

						// Use the organization from purchase if available, otherwise ensure personal org
						if (purchase.organizationId) {
							const orgMembership = await adapter.addMemberToOrganization({
								organizationId: purchase.organizationId,
								userId: user.id,
								invitedById,
							})

							if (!orgMembership) {
								throw new Error(`orgMembership is required`)
							}

							await adapter.addRoleForMember({
								organizationId: purchase.organizationId,
								memberId: orgMembership.id,
								role: 'learner',
							})

							return {
								organizationId: purchase.organizationId,
								orgMembership,
							}
						} else {
							// No organizationId on purchase - ensure user has personal org
							const personalOrgResult =
								await ensurePersonalOrganizationWithLearnerRole(user, adapter)

							return {
								organizationId: personalOrgResult.organization.id,
								orgMembership: personalOrgResult.membership,
							}
						}
					},
				)

				if (cohortContentAccessEntitlementType && cohortResource?.resources) {
					await step.sendEvent('send-discord-role-event', {
						name: USER_ADDED_TO_COHORT_EVENT,
						data: {
							cohortId: cohortResource.id,
							userId: user.id,
							discordRoleId: env.DISCORD_COHORT_001_ROLE_ID,
						},
					})

					await step.run(`add cohort discord entitlement`, async () => {
						if (!cohortDiscordRoleEntitlementType) {
							return 'no cohort discord role entitlement type found'
						}

						const entitlementId = `${cohortResource.id}-discord-${guid()}`
						const entitlementData = {
							id: entitlementId,
							entitlementType: cohortDiscordRoleEntitlementType.id,
							sourceType: 'cohort',
							sourceId: cohortResource.id,
							userId: user.id,
							organizationId,
							organizationMembershipId: orgMembership.id,
							metadata: {
								discordRoleId: env.DISCORD_COHORT_001_ROLE_ID,
							},
						}

						await db.insert(entitlements).values(entitlementData)

						return {
							entitlementId,
						}
					})

					await step.run(`add user to cohort via entitlement`, async () => {
						const createdEntitlements = []

						for (const resource of cohortResource.resources || []) {
							const entitlementId = await createCohortEntitlement({
								userId: user.id,
								resourceId: resource.resource.id,
								sourceId: cohortResource.id,
								organizationId,
								organizationMembershipId: orgMembership.id,
								entitlementType: cohortContentAccessEntitlementType.id,
								sourceType: 'cohort',
								metadata: {
									contentIds: [resource.resource.id],
								},
							})

							createdEntitlements.push({
								entitlementId,
								resourceId: resource.resource.id,
								resourceType: resource.resource.type,
								resourceTitle: resource.resource.fields?.title,
							})
						}

						await log.info('cohort_entitlements_created', {
							userId: user.id,
							cohortId: cohortResource.id,
							entitlementsCreated: createdEntitlements.length,
							organizationId,
							organizationMembershipId: orgMembership.id,
						})

						return {
							entitlementsCreated: createdEntitlements.length,
							entitlements: createdEntitlements,
							organizationId,
							organizationMembershipId: orgMembership.id,
							userId: user.id,
						}
					})

					await step.run(`send welcome email to individual`, async () => {
						const dayZeroWorkshop = cohortResource.resources?.find(
							(resource) => resource.position === 0,
						)?.resource
						const dayZeroSlug = dayZeroWorkshop.fields?.slug
						const dayZeroUrl = `${env.COURSEBUILDER_URL}/workshops/${dayZeroSlug}`
						const ComponentToSend = getCohortWelcomeEmailVariant({
							isTeamPurchase: false,
							isFullPriceCouponRedemption,
						})

						await sendAnEmail({
							Component: ComponentToSend,
							componentProps: {
								cohortTitle:
									cohortResource.fields.title || cohortResource.fields.slug,
								url: dayZeroUrl,
								dayOneUnlockDate,
								quantity: purchase.totalAmount || 1,
								userFirstName: user.name?.split(' ')[0],
							},
							Subject: `Welcome to ${cohortResource.fields.title || 'AI Hero'}!`,
							To: user.email,
							ReplyTo: env.NEXT_PUBLIC_SUPPORT_EMAIL,
							From: env.NEXT_PUBLIC_SUPPORT_EMAIL,
							type: 'transactional',
						})

						await log.info('cohort_welcome_email.sent', {
							purchaseId: purchase.id,
							emailType: isFullPriceCouponRedemption
								? 'coupon_redeemer'
								: 'individual',
						})
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
			isFullPriceCouponRedemption,
			bulkCouponData,
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
