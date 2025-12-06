import { courseBuilderAdapter, db } from '@/db'
import { entitlements, entitlementTypes, purchases, users } from '@/db/schema'
import { PRODUCT_SYNC_WORKSHOP_ENTITLEMENTS_EVENT } from '@/inngest/events/product-sync-workshop-entitlements'
import { inngest } from '@/inngest/inngest.server'
import {
	createWorkshopEntitlement,
	EntitlementSourceType,
} from '@/lib/entitlements'
import { ensurePersonalOrganizationWithLearnerRole } from '@/lib/personal-organization-service'
import { log } from '@/server/logger'
import { and, eq, isNull, or, sql } from 'drizzle-orm'

/**
 * Workshop IDs that everyone with this product should have
 */
const WORKSHOP_IDS = [
	'workshop-ddk2h',
	'workshop-aubv9',
	'workshop-flccv',
	'workshop-mtezq',
	'workshop-bmisp',
]

/**
 * Check if a user already has an entitlement for a specific workshop
 */
async function hasExistingWorkshopEntitlement(
	userId: string,
	workshopId: string,
	entitlementTypeId: string,
): Promise<boolean> {
	const existingEntitlement = await db.query.entitlements.findFirst({
		where: and(
			eq(entitlements.userId, userId),
			eq(entitlements.entitlementType, entitlementTypeId),
			isNull(entitlements.deletedAt),
			sql`JSON_CONTAINS(${entitlements.metadata}, ${JSON.stringify(workshopId)}, '$.contentIds')`,
		),
	})

	return !!existingEntitlement
}

/**
 * Get all workshop entitlements a user currently has
 */
async function getUserWorkshopEntitlements(
	userId: string,
	entitlementTypeId: string,
): Promise<string[]> {
	const userEntitlements = await db.query.entitlements.findMany({
		where: and(
			eq(entitlements.userId, userId),
			eq(entitlements.entitlementType, entitlementTypeId),
			isNull(entitlements.deletedAt),
		),
	})

	const workshopIds: string[] = []
	for (const entitlement of userEntitlements) {
		const metadata = entitlement.metadata as any
		if (metadata?.contentIds && Array.isArray(metadata.contentIds)) {
			for (const contentId of metadata.contentIds) {
				if (WORKSHOP_IDS.includes(contentId)) {
					workshopIds.push(contentId)
				}
			}
		}
	}

	return [...new Set(workshopIds)] // Remove duplicates
}

/**
 * Inngest function to sync workshop entitlements for all purchases of a specific product.
 *
 * This function:
 * 1. Finds all purchases for the given productId
 * 2. For each person, checks what workshop entitlements they currently have
 * 3. Compares with the required 5 workshop entitlements
 * 4. Creates only the missing entitlements
 * 5. Skips people who already have all required entitlements
 *
 * Triggered by: 'product/sync-workshop-entitlements'
 */
export const syncProductWorkshopEntitlements = inngest.createFunction(
	{
		id: 'sync-product-workshop-entitlements',
		name: 'Sync Workshop Entitlements for Product Purchases',
	},
	{
		event: PRODUCT_SYNC_WORKSHOP_ENTITLEMENTS_EVENT,
	},
	async ({ event, step }) => {
		const { productId } = event.data

		await step.run('validate-inputs', async () => {
			if (!productId) {
				throw new Error('productId is required')
			}

			await log.info('product_workshop_entitlements_sync.started', {
				productId,
			})

			return { productId }
		})

		// Get the entitlement type for workshop content access
		const entitlementType = await step.run('get-entitlement-type', async () => {
			const workshopContentAccessEntitlementType =
				await db.query.entitlementTypes.findFirst({
					where: eq(entitlementTypes.name, 'workshop_content_access'),
				})

			if (!workshopContentAccessEntitlementType) {
				throw new Error('workshop_content_access entitlement type not found')
			}

			return workshopContentAccessEntitlementType
		})

		// Find all purchases for this product
		const purchasesWithUsers = await step.run(
			'find-purchases-for-product',
			async () => {
				await log.info('product_workshop_entitlements_sync.finding_purchases', {
					productId,
				})

				// TODO: Remove .limit(5) after testing - this is a temporary test limit
				const allResults = await db
					.select({
						purchaseId: purchases.id,
						userId: purchases.userId,
						organizationId: purchases.organizationId,
						organizationMembershipId:
							purchases.purchasedByorganizationMembershipId,
						productId: purchases.productId,
						status: purchases.status,
						createdAt: purchases.createdAt,
						userEmail: users.email,
						userName: users.name,
					})
					.from(purchases)
					.innerJoin(users, eq(users.id, purchases.userId))
					.where(eq(purchases.productId, productId))

				await log.info('product_workshop_entitlements_sync.purchases_found', {
					productId,
					count: allResults.length,
				})

				return allResults
			},
		)

		if (purchasesWithUsers.length === 0) {
			await step.run('no-purchases-found', async () => {
				await log.info('product_workshop_entitlements_sync.no_purchases', {
					productId,
				})
			})

			return {
				productId,
				message: 'No purchases found for product',
				totalPurchasesFound: 0,
				successCount: 0,
				errorCount: 0,
			}
		}

		// Process each purchase/person in their own individual step
		const personResults = await Promise.allSettled(
			purchasesWithUsers.map((purchaseData, index) =>
				step.run(
					`sync-person-${index}-${purchaseData.purchaseId}`,
					async () => {
						try {
							if (!purchaseData.userId) {
								await log.warn(
									'product_workshop_entitlements_sync.skipped_no_user',
									{
										purchaseId: purchaseData.purchaseId,
									},
								)
								return {
									purchaseId: purchaseData.purchaseId,
									success: false,
									error: 'No userId',
									successResults: [],
									errorResults: [
										{
											purchaseId: purchaseData.purchaseId,
											error: 'No userId',
										},
									],
									skippedResults: [],
								}
							}

							// Get the user
							const user = await db.query.users.findFirst({
								where: eq(users.id, purchaseData.userId),
							})

							if (!user) {
								await log.warn(
									'product_workshop_entitlements_sync.user_not_found',
									{
										userId: purchaseData.userId,
										purchaseId: purchaseData.purchaseId,
									},
								)
								return {
									purchaseId: purchaseData.purchaseId,
									success: false,
									error: 'User not found',
									successResults: [],
									errorResults: [
										{
											purchaseId: purchaseData.purchaseId,
											userId: purchaseData.userId,
											error: 'User not found',
										},
									],
									skippedResults: [],
								}
							}

							// Get user's current workshop entitlements
							const currentWorkshopIds = await getUserWorkshopEntitlements(
								user.id,
								entitlementType.id,
							)

							// Find which workshops are missing
							const missingWorkshopIds = WORKSHOP_IDS.filter(
								(workshopId) => !currentWorkshopIds.includes(workshopId),
							)

							if (missingWorkshopIds.length === 0) {
								await log.info(
									'product_workshop_entitlements_sync.user_has_all_entitlements',
									{
										userId: user.id,
										userEmail: user.email,
										purchaseId: purchaseData.purchaseId,
										currentWorkshopIds,
									},
								)
								return {
									purchaseId: purchaseData.purchaseId,
									success: true,
									successResults: [],
									errorResults: [],
									skippedResults: [
										{
											purchaseId: purchaseData.purchaseId,
											userId: user.id,
											userEmail: user.email,
											reason: 'User already has all required entitlements',
											workshopIds: WORKSHOP_IDS,
										},
									],
								}
							}

							// Determine organization and membership
							let organizationId: string
							let organizationMembershipId: string

							if (purchaseData.organizationId) {
								organizationId = purchaseData.organizationId

								if (purchaseData.organizationMembershipId) {
									organizationMembershipId =
										purchaseData.organizationMembershipId
								} else {
									const membership =
										await courseBuilderAdapter.addMemberToOrganization({
											organizationId: purchaseData.organizationId,
											userId: user.id,
											invitedById: user.id,
										})

									if (!membership) {
										throw new Error(
											`Failed to get/create membership for user ${user.id}`,
										)
									}

									organizationMembershipId = membership.id

									await courseBuilderAdapter.addRoleForMember({
										organizationId: purchaseData.organizationId,
										memberId: membership.id,
										role: 'learner',
									})
								}
							} else {
								const personalOrgResult =
									await ensurePersonalOrganizationWithLearnerRole(
										user,
										courseBuilderAdapter,
									)
								organizationId = personalOrgResult.organization.id
								organizationMembershipId = personalOrgResult.membership.id
							}

							const successResults: Array<{
								purchaseId: string
								userId: string
								userEmail: string | null
								workshopId: string
								entitlementId: string
							}> = []
							const errorResults: Array<{
								purchaseId: string
								userId?: string | null
								userEmail?: string | null
								workshopId?: string
								error: string
							}> = []
							const skippedResults: Array<{
								purchaseId: string
								userId: string
								userEmail: string | null
								workshopId: string
								reason: string
							}> = []

							// Create entitlements only for missing workshops
							for (const workshopId of missingWorkshopIds) {
								try {
									// Double-check (in case it was created between checks)
									const alreadyHasEntitlement =
										await hasExistingWorkshopEntitlement(
											user.id,
											workshopId,
											entitlementType.id,
										)

									if (alreadyHasEntitlement) {
										await log.info(
											'product_workshop_entitlements_sync.entitlement_already_exists',
											{
												productId,
												userId: user.id,
												userEmail: user.email,
												purchaseId: purchaseData.purchaseId,
												workshopId,
											},
										)
										skippedResults.push({
											purchaseId: purchaseData.purchaseId,
											userId: user.id,
											userEmail: user.email,
											workshopId,
											reason: 'Entitlement already exists',
										})
										continue
									}

									// Create entitlement for the workshop
									const entitlementId = await createWorkshopEntitlement({
										userId: user.id,
										resourceId: workshopId,
										organizationId,
										organizationMembershipId,
										entitlementType: entitlementType.id,
										sourceType: EntitlementSourceType.PURCHASE,
										sourceId: purchaseData.purchaseId,
										metadata: {
											contentIds: [workshopId],
										},
									})

									await log.info(
										'product_workshop_entitlements_sync.entitlement_created',
										{
											productId,
											userId: user.id,
											userEmail: user.email,
											purchaseId: purchaseData.purchaseId,
											workshopId,
											entitlementId,
										},
									)

									successResults.push({
										purchaseId: purchaseData.purchaseId,
										userId: user.id,
										userEmail: user.email,
										workshopId,
										entitlementId,
									})
								} catch (error) {
									await log.error(
										'product_workshop_entitlements_sync.entitlement_creation_error',
										{
											productId,
											purchaseId: purchaseData.purchaseId,
											userId: user.id,
											userEmail: user.email,
											workshopId,
											error:
												error instanceof Error ? error.message : String(error),
										},
									)

									errorResults.push({
										purchaseId: purchaseData.purchaseId,
										userId: user.id,
										userEmail: user.email,
										workshopId,
										error:
											error instanceof Error ? error.message : String(error),
									})
								}
							}

							return {
								purchaseId: purchaseData.purchaseId,
								success: true,
								successResults,
								errorResults,
								skippedResults,
							}
						} catch (error) {
							await log.error(
								'product_workshop_entitlements_sync.purchase_processing_error',
								{
									productId,
									purchaseId: purchaseData.purchaseId,
									userId: purchaseData.userId,
									userEmail: purchaseData.userEmail,
									error: error instanceof Error ? error.message : String(error),
								},
							)

							return {
								purchaseId: purchaseData.purchaseId,
								success: false,
								error: error instanceof Error ? error.message : String(error),
								successResults: [],
								errorResults: [
									{
										purchaseId: purchaseData.purchaseId,
										userId: purchaseData.userId ?? undefined,
										userEmail: purchaseData.userEmail ?? undefined,
										error:
											error instanceof Error ? error.message : String(error),
									},
								],
								skippedResults: [],
							}
						}
					},
				),
			),
		)

		// Aggregate results from all individual steps
		const results = await step.run('aggregate-results', async () => {
			const successResults: Array<{
				purchaseId: string
				userId: string
				userEmail: string | null
				workshopId: string
				entitlementId: string
			}> = []
			const errorResults: Array<{
				purchaseId: string
				userId?: string | null
				userEmail?: string | null
				workshopId?: string
				error: string
			}> = []
			const skippedResults: Array<{
				purchaseId: string
				userId: string
				userEmail: string | null
				workshopId?: string
				reason: string
			}> = []

			for (const result of personResults) {
				if (result.status === 'fulfilled' && result.value) {
					// Filter out null values from all arrays
					const validSuccessResults = (
						result.value.successResults || []
					).filter((item): item is NonNullable<typeof item> => item !== null)
					const validErrorResults = (result.value.errorResults || []).filter(
						(item): item is NonNullable<typeof item> => item !== null,
					)
					const validSkippedResults = (result.value.skippedResults || [])
						.filter((item): item is NonNullable<typeof item> => item !== null)
						.flatMap((item) => {
							// Handle case where user has all entitlements (workshopIds array)
							if ('workshopIds' in item && Array.isArray(item.workshopIds)) {
								// Convert to individual entries for each workshop
								return item.workshopIds.map((workshopId) => ({
									purchaseId: item.purchaseId,
									userId: item.userId,
									userEmail: item.userEmail,
									workshopId,
									reason: item.reason,
								}))
							}
							// Already in the correct format
							return {
								purchaseId: item.purchaseId,
								userId: item.userId,
								userEmail: item.userEmail,
								workshopId: 'workshopId' in item ? item.workshopId : undefined,
								reason: item.reason,
							}
						})

					successResults.push(...validSuccessResults)
					errorResults.push(...validErrorResults)
					skippedResults.push(...validSkippedResults)
				} else if (result.status === 'fulfilled' && !result.value) {
					errorResults.push({
						purchaseId: 'unknown',
						error: 'Step returned null result',
					})
				} else if (result.status === 'rejected') {
					const reason = result.reason
					await log.error(
						'product_workshop_entitlements_sync.step_execution_failed',
						{
							productId,
							error: reason instanceof Error ? reason.message : String(reason),
						},
					)
					errorResults.push({
						purchaseId: 'unknown',
						error: `Step execution failed: ${reason instanceof Error ? reason.message : String(reason)}`,
					})
				}
			}

			return {
				successResults,
				errorResults,
				skippedResults,
			}
		})

		await step.run('log-completion', async () => {
			await log.info('product_workshop_entitlements_sync.completed', {
				productId,
				totalPurchases: purchasesWithUsers.length,
				successCount: results.successResults.length,
				errorCount: results.errorResults.length,
				skippedCount: results.skippedResults.length,
			})
			return { logged: true }
		})

		return {
			productId,
			message: `Sync completed: ${results.successResults.length} entitlements created, ${results.skippedResults.length} skipped across ${purchasesWithUsers.length} purchases`,
			totalPurchasesFound: purchasesWithUsers.length,
			successCount: results.successResults.length,
			errorCount: results.errorResults.length,
			skippedCount: results.skippedResults.length,
			errors: results.errorResults,
			skipped: results.skippedResults,
		}
	},
)
