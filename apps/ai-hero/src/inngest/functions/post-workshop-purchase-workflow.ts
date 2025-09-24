import { db } from '@/db'
import { contentResourceResource, entitlementTypes } from '@/db/schema'
import { env } from '@/env.mjs'
import { inngest } from '@/inngest/inngest.server'
import { getWorkshopWelcomeEmailVariant } from '@/inngest/utils/get-workshop-welcome-email-variant'
import {
	createWorkshopEntitlement,
	EntitlementSourceType,
} from '@/lib/entitlements'
import { ensurePersonalOrganizationWithLearnerRole } from '@/lib/personal-organization-service'
import { getWorkshop } from '@/lib/workshops-query'
import { log } from '@/server/logger'
import { sendAnEmail } from '@/utils/send-an-email'
import { and, eq } from 'drizzle-orm'

import { guid } from '@coursebuilder/adapter-drizzle/mysql'
import { FULL_PRICE_COUPON_REDEEMED_EVENT } from '@coursebuilder/core/inngest/commerce/event-full-price-coupon-redeemed'
import { NEW_PURCHASE_CREATED_EVENT } from '@coursebuilder/core/inngest/commerce/event-new-purchase-created'
import { getResourcePath } from '@coursebuilder/utils-resource/resource-paths'

import { USER_ADDED_TO_WORKSHOP_EVENT } from './discord/add-workshop-role-discord'

export const postWorkshopPurchaseWorkflow = inngest.createFunction(
	{
		id: `post-workshop-purchase-workflow`,
		name: `Post Workshop Purchase Followup Workflow`,
	},
	[
		{
			event: NEW_PURCHASE_CREATED_EVENT,
			if: 'event.data.productType == "self-paced"',
		},
		{
			event: FULL_PRICE_COUPON_REDEEMED_EVENT,
			if: 'event.data.productType == "self-paced"',
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

		// the workshop should be part of the product resources
		const workshopResourceId = product.resources?.find(
			(resource) => resource.resource?.type === 'workshop',
		)?.resource.id

		const workshopResource = await step.run(
			`get workshop resource`,
			async () => {
				return getWorkshop(workshopResourceId)
			},
		)

		if (!workshopResource) {
			throw new Error(`workshop resource not found`)
		}

		if (isTeamPurchase) {
			const bulkCoupon = await step.run('get bulk coupon', async () => {
				if (purchase.bulkCouponId) {
					return adapter.getCoupon(purchase.bulkCouponId)
				}
				return null
			})

			await step.run(`send welcome email to team purchaser`, async () => {
				const workshopUrl = getResourcePath(
					workshopResource.type,
					workshopResource.fields.slug,
					'view',
				)

				await sendAnEmail({
					Component: getWorkshopWelcomeEmailVariant({
						isTeamPurchase: true,
						isFullPriceCouponRedemption,
					}),
					componentProps: {
						workshopTitle:
							workshopResource.fields.title || workshopResource.fields.slug,
						url: workshopUrl,
						quantity: bulkCoupon?.maxUses || 1,
						userFirstName: user.name?.split(' ')[0],
					},
					Subject: `Welcome to ${workshopResource.fields.title || 'Epic AI Pro'}!`,
					To: user.email,
					ReplyTo: env.NEXT_PUBLIC_SUPPORT_EMAIL,
					From: env.NEXT_PUBLIC_SUPPORT_EMAIL,
					type: 'transactional',
				})

				await log.info('workshop_welcome_email.sent', {
					purchaseId: purchase.id,
					emailType: 'team_purchaser',
				})
			})

			if (isFullPriceCouponRedemption) {
				// await step.run(
				// 	`send live office hours email to team member ticket redeemer`,
				// 	async () => {
				// 		await sendAnEmail({
				// 			Component: LiveOfficeHoursInvitation,
				// 			componentProps: {
				// 				...liveOfficeHoursEmailProps,
				// 			},
				// 			Subject: `${liveOfficeHoursEmailProps.eventTitle} - ${liveOfficeHoursEmailProps.eventDate}`,
				// 			To: user.email,
				// 			ReplyTo: env.NEXT_PUBLIC_SUPPORT_EMAIL,
				// 			From: env.NEXT_PUBLIC_SUPPORT_EMAIL,
				// 			type: 'transactional',
				// 			attachments: generateICSAttachments(
				// 				liveOfficeHoursEmailProps.eventTitle,
				// 				liveOfficeHoursEmailProps.firstEvent,
				// 				liveOfficeHoursEmailProps.secondEvent,
				// 			),
				// 		})
				// 	},
				// )
			}
		} else {
			if (['Valid', 'Restricted'].includes(purchase.status)) {
				const workshopContentAccessEntitlementType = await step.run(
					`get workshop content access entitlement type`,
					async () => {
						return await db.query.entitlementTypes.findFirst({
							where: eq(entitlementTypes.name, 'workshop_content_access'),
						})
					},
				)

				const workshopDiscordRoleEntitlementType = await step.run(
					`get workshop discord role entitlement type`,
					async () => {
						return await db.query.entitlementTypes.findFirst({
							where: eq(entitlementTypes.name, 'workshop_discord_role'),
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

				if (workshopContentAccessEntitlementType && workshopResource) {
					await step.sendEvent('send-discord-role-event', {
						name: USER_ADDED_TO_WORKSHOP_EVENT,
						data: {
							workshopId: workshopResource.id,
							userId: user.id,
							discordRoleId:
								product.fields.discordRoleId || env.DISCORD_PURCHASER_ROLE_ID,
						},
					})

					await step.run(`add workshop discord entitlement`, async () => {
						if (!workshopDiscordRoleEntitlementType) {
							return 'no workshop discord role entitlement type found'
						}

						if (
							!product.fields.discordRoleId &&
							!env.DISCORD_PURCHASER_ROLE_ID
						) {
							return 'no discord workshop role id found'
						}

						if (!workshopResource.id) {
							return 'no workshop resource id found'
						}

						const entitlementId = `${workshopResource.id}-discord-${guid()}`
						await createWorkshopEntitlement({
							id: entitlementId,
							userId: user.id,
							organizationId,
							organizationMembershipId: orgMembership.id,
							entitlementType: workshopDiscordRoleEntitlementType.id,
							sourceType: EntitlementSourceType.PURCHASE,
							sourceId: purchase.id,
							metadata: {
								discordRoleId:
									product.fields.discordRoleId || env.DISCORD_PURCHASER_ROLE_ID,
							},
						})

						return {
							entitlementId,
						}
					})

					await step.run(`add user to workshop via entitlement`, async () => {
						const createdEntitlements = []

						if (!workshopResource.id) {
							return 'no workshop resource id found'
						}

						const entitlementId = await createWorkshopEntitlement({
							userId: user.id,
							resourceId: workshopResource.id,
							sourceId: purchase.id,
							organizationId,
							organizationMembershipId: orgMembership.id,
							entitlementType: workshopContentAccessEntitlementType.id,
							sourceType: EntitlementSourceType.PURCHASE,
							metadata: {
								contentIds: [workshopResource.id],
							},
						})

						createdEntitlements.push({
							entitlementId,
							resourceId: workshopResource.id,
							resourceType: workshopResource.type,
							resourceTitle: workshopResource.fields?.title,
						})

						await log.info('workshop_entitlements_created', {
							userId: user.id,
							workshopId: workshopResource.id,
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
						const workshopUrl = getResourcePath(
							workshopResource.type,
							workshopResource.fields.slug,
							'view',
						)
						const ComponentToSend = getWorkshopWelcomeEmailVariant({
							isTeamPurchase: false,
							isFullPriceCouponRedemption,
						})

						await sendAnEmail({
							Component: ComponentToSend,
							componentProps: {
								workshopTitle:
									workshopResource.fields.title || workshopResource.fields.slug,
								url: workshopUrl,
								quantity: purchase.totalAmount || 1,
								userFirstName: user.name?.split(' ')[0],
							},
							Subject: `Welcome to ${workshopResource.fields.title || 'AI Hero'}!`,
							To: user.email,
							ReplyTo: env.NEXT_PUBLIC_SUPPORT_EMAIL,
							From: env.NEXT_PUBLIC_SUPPORT_EMAIL,
							type: 'transactional',
						})

						await log.info('workshop_welcome_email.sent', {
							purchaseId: purchase.id,
							emailType: isFullPriceCouponRedemption
								? 'coupon_redeemer'
								: 'individual',
						})
					})

					// await step.run(
					// 	`send live office hours email to individual purchaser`,
					// 	async () => {
					// 		await sendAnEmail({
					// 			Component: LiveOfficeHoursInvitation,
					// 			componentProps: {
					// 				...liveOfficeHoursEmailProps,
					// 			},
					// 			Subject: `${liveOfficeHoursEmailProps.eventTitle} - ${liveOfficeHoursEmailProps.eventDate}`,
					// 			To: user.email,
					// 			ReplyTo: env.NEXT_PUBLIC_SUPPORT_EMAIL,
					// 			From: env.NEXT_PUBLIC_SUPPORT_EMAIL,
					// 			type: 'transactional',
					// 			attachments: generateICSAttachments(
					// 				liveOfficeHoursEmailProps.eventTitle,
					// 				liveOfficeHoursEmailProps.firstEvent,
					// 				liveOfficeHoursEmailProps.secondEvent,
					// 			),
					// 		})
					// 	},
					// )
				}
			} else {
				// send a slack message or something because it seems broken
			}
		}

		return {
			purchase,
			product,
			user,
			workshopResource,
			isTeamPurchase,
			isFullPriceCouponRedemption,
			bulkCouponData,
		}
	},
)

const getContentIdsForTier = async (
	workshopResourceId: string,
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
		where: and(eq(contentResourceResource.resourceOfId, workshopResourceId)),
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
