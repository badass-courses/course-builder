import { courseBuilderAdapter, db } from '@/db'
import {
	coupon,
	entitlements,
	entitlementTypes,
	organizationMemberships,
	purchases,
	users,
} from '@/db/schema'
import { inngest } from '@/inngest/inngest.server'
import { EntitlementSourceType } from '@/lib/entitlements'
import { ensurePersonalOrganizationWithLearnerRole } from '@/lib/personal-organization-service'
import { log } from '@/server/logger'
import { and, eq, gt, inArray, isNull } from 'drizzle-orm'

import { guid } from '@coursebuilder/adapter-drizzle/mysql'

export const GRANT_COUPON_ENTITLEMENTS_EVENT =
	'coupon/grant-entitlements' as const

export type GrantCouponEntitlementsEvent = {
	name: typeof GRANT_COUPON_ENTITLEMENTS_EVENT
	data: {
		couponId: string
	}
}

export const grantCouponEntitlements = inngest.createFunction(
	{
		id: `grant-coupon-entitlements`,
		name: `Grant Coupon Entitlements`,
		idempotency: 'event.data.couponId',
	},
	{
		event: GRANT_COUPON_ENTITLEMENTS_EVENT,
	},
	async ({ event, step }) => {
		const { couponId } = event.data

		const couponRecord = await step.run('get coupon', async () => {
			const foundCoupon = await db.query.coupon.findFirst({
				where: eq(coupon.id, couponId),
			})

			if (!foundCoupon) {
				throw new Error(`Coupon not found: ${couponId}`)
			}

			return {
				coupon: foundCoupon,
				summary: {
					id: foundCoupon.id,
					merchantCouponId: foundCoupon.merchantCouponId,
					status: foundCoupon.status,
					expires: foundCoupon.expires,
					restrictedToProductId: foundCoupon.restrictedToProductId,
					hasEligibilityCondition: !!foundCoupon.fields?.eligibilityCondition,
				},
			}
		})

		const eligibilityCondition = await step.run(
			'check eligibility condition',
			async () => {
				const fields = couponRecord.coupon.fields
				const rawCondition = fields?.eligibilityCondition as
					| {
							type: 'hasValidProductPurchase'
							productId: string
					  }
					| undefined

				if (!rawCondition) {
					await log.info('coupon.entitlements.skipped', {
						couponId,
						reason: 'No eligibility condition found in fields',
					})
					return {
						condition: null,
						summary: {
							hasCondition: false,
							reason: 'No eligibility condition found in coupon fields',
							fieldsPresent: !!fields,
						},
					}
				}

				if (rawCondition.type !== 'hasValidProductPurchase') {
					await log.info('coupon.entitlements.skipped', {
						couponId,
						reason: `Unsupported condition type: ${rawCondition.type}`,
					})
					return {
						condition: null,
						summary: {
							hasCondition: false,
							reason: `Unsupported condition type: ${rawCondition.type}`,
							conditionType: rawCondition.type,
						},
					}
				}

				return {
					condition: rawCondition,
					summary: {
						hasCondition: true,
						type: rawCondition.type,
						productId: rawCondition.productId,
					},
				}
			},
		)

		if (!eligibilityCondition.condition) {
			return {
				granted: 0,
				skipped: true,
				reason: eligibilityCondition.summary.reason,
			}
		}

		const couponCreditEntitlementType = await step.run(
			'get coupon credit entitlement type',
			async () => {
				const entitlementType = await db.query.entitlementTypes.findFirst({
					where: eq(entitlementTypes.name, 'apply_special_credit'),
				})

				if (!entitlementType) {
					throw new Error(
						`Coupon credit entitlement type 'apply_special_credit' not found in database`,
					)
				}

				return {
					entitlementType,
					summary: {
						id: entitlementType.id,
						name: entitlementType.name,
						description: entitlementType.description,
					},
				}
			},
		)

		const eligiblePurchases = await step.run(
			'find eligible purchases',
			async () => {
				const purchasesList = await db.query.purchases.findMany({
					where: and(
						eq(purchases.productId, eligibilityCondition.condition.productId),
						inArray(purchases.status, ['Valid']),
						gt(purchases.totalAmount, '0'),
						isNull(purchases.bulkCouponId),
					),
					with: {
						user: true,
					},
				})

				const purchasesWithUsers = purchasesList.filter(
					(p): p is typeof p & { userId: string } => Boolean(p.userId),
				)
				const purchasesWithoutUsers =
					purchasesList.length - purchasesWithUsers.length

				return {
					purchases: purchasesList,
					summary: {
						totalPurchases: purchasesList.length,
						purchasesWithUsers: purchasesWithUsers.length,
						purchasesWithoutUsers,
						productId: eligibilityCondition.condition.productId,
					},
				}
			},
		)

		if (eligiblePurchases.purchases.length === 0) {
			await log.info('coupon.entitlements.no_eligible_users', {
				couponId,
				productId: eligibilityCondition.condition.productId,
			})
			return {
				granted: 0,
				eligibleUsers: 0,
				reason: 'No eligible purchases found for product',
				productId: eligibilityCondition.condition.productId,
			}
		}

		const uniqueUserIds = await step.run('get unique user ids', async () => {
			const userIds = eligiblePurchases.purchases
				.map((p: (typeof eligiblePurchases.purchases)[number]) => p.userId)
				.filter((id): id is string => Boolean(id))

			const unique = Array.from(new Set(userIds))
			const duplicatesRemoved = userIds.length - unique.length

			await log.info('coupon.entitlements.user_deduplication', {
				couponId,
				totalPurchases: eligiblePurchases.purchases.length,
				uniqueUsers: unique.length,
				nullUserIds: eligiblePurchases.purchases.length - userIds.length,
			})

			return {
				userIds: unique,
				summary: {
					totalPurchases: eligiblePurchases.purchases.length,
					uniqueUsers: unique.length,
					duplicatesRemoved,
					purchasesWithoutUserIds:
						eligiblePurchases.purchases.length - userIds.length,
				},
			}
		})

		const grantedCount = await step.run(
			'grant entitlements to eligible users',
			async () => {
				let granted = 0
				let skipped = 0
				let failed = 0
				const failedUserIds: string[] = []
				const skippedUserIds: string[] = []
				const grantedUserIds: string[] = []

				for (const userId of uniqueUserIds.userIds) {
					try {
						// Get user data
						const user = await db.query.users.findFirst({
							where: eq(users.id, userId),
						})

						if (!user || !user.email) {
							await log.warn('coupon.entitlements.user_not_found', {
								couponId,
								userId,
							})
							failed++
							failedUserIds.push(userId)
							continue
						}

						const personalOrgResult =
							await ensurePersonalOrganizationWithLearnerRole(
								{ id: user.id, email: user.email },
								courseBuilderAdapter,
							)

						const existingEntitlement = await db.query.entitlements.findFirst({
							where: and(
								eq(entitlements.userId, userId),
								eq(entitlements.sourceId, couponId),
								eq(entitlements.sourceType, EntitlementSourceType.COUPON),
								eq(
									entitlements.entitlementType,
									couponCreditEntitlementType.entitlementType.id,
								),
								isNull(entitlements.deletedAt),
							),
						})

						if (existingEntitlement) {
							skipped++
							skippedUserIds.push(userId)
							continue
						}

						const entitlementId = `${couponId}-${guid()}`
						await db.insert(entitlements).values({
							id: entitlementId,
							userId,
							organizationId: personalOrgResult.organization.id,
							organizationMembershipId: personalOrgResult.membership.id,
							entitlementType: couponCreditEntitlementType.entitlementType.id,
							sourceType: EntitlementSourceType.COUPON,
							sourceId: couponId,
							metadata: {
								eligibilityProductId: eligibilityCondition.condition.productId,
							},
						})

						granted++
						grantedUserIds.push(userId)
					} catch (error) {
						failed++
						failedUserIds.push(userId)
						await log.error('coupon.entitlements.grant_failed', {
							couponId,
							userId,
							error: error instanceof Error ? error.message : 'Unknown error',
							stack: error instanceof Error ? error.stack : undefined,
						})
					}
				}

				return {
					granted,
					skipped,
					failed,
					summary: {
						totalProcessed: uniqueUserIds.userIds.length,
						granted,
						skipped,
						failed,
					},
				}
			},
		)

		await log.info('coupon.entitlements.granted', {
			couponId,
			eligibleUsers: uniqueUserIds.summary.uniqueUsers,
			granted: grantedCount.granted,
			skipped: grantedCount.skipped,
			failed: grantedCount.failed,
		})

		return {
			granted: grantedCount.granted,
			skipped: grantedCount.skipped,
			failed: grantedCount.failed,
			eligibleUsers: uniqueUserIds.summary.uniqueUsers,
			summary: {
				couponId,
				productId: eligibilityCondition.condition.productId,
				entitlementTypeId: couponCreditEntitlementType.summary.id,
				totalEligiblePurchases: eligiblePurchases.summary.totalPurchases,
				uniqueEligibleUsers: uniqueUserIds.summary.uniqueUsers,
				entitlementsGranted: grantedCount.granted,
				entitlementsSkipped: grantedCount.skipped,
				entitlementsFailed: grantedCount.failed,
			},
		}
	},
)
