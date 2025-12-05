import { courseBuilderAdapter, db } from '@/db'
import {
	contentResource,
	contentResourceProduct,
	entitlementTypes,
	purchases,
	users,
} from '@/db/schema'
import { inngest } from '@/inngest/inngest.server'
import {
	createCohortEntitlement,
	EntitlementSourceType,
} from '@/lib/entitlements'
import { ensurePersonalOrganizationWithLearnerRole } from '@/lib/personal-organization-service'
import { log } from '@/server/logger'
import {
	and,
	count,
	eq,
	inArray,
	isNotNull,
	isNull,
	ne,
	or,
	sql,
} from 'drizzle-orm'

import {
	COHORT_ENTITLEMENT_MIGRATION_EVENT,
	type CohortEntitlementMigration,
} from '../events/cohort-entitlement-migration'

/**
 * Inngest function to migrate entitlements from one cohort to another.
 *
 * This function:
 * 1. Finds all purchases for products linked to the source cohort ID
 * 2. Gets all purchase details (userId, organizationId, etc.)
 * 3. Creates new entitlements for the target cohort ID for each person
 *
 * Triggered by: COHORT_ENTITLEMENT_MIGRATION_EVENT
 */
export const migrateCohortEntitlements = inngest.createFunction(
	{
		id: 'migrate-cohort-entitlements',
		name: 'Migrate Entitlements from One Cohort to Another',
	},
	{
		event: COHORT_ENTITLEMENT_MIGRATION_EVENT,
	},
	async ({ event, step }) => {
		const { sourceCohortId, targetCohortId } = event.data

		await step.run('validate-inputs', async () => {
			if (!sourceCohortId || !targetCohortId) {
				throw new Error('Both sourceCohortId and targetCohortId are required')
			}

			await log.info('cohort_entitlement_migration.started', {
				sourceCohortId,
				targetCohortId,
			})

			return { sourceCohortId, targetCohortId }
		})

		// Get the entitlement type for cohort content access
		const entitlementType = await step.run('get-entitlement-type', async () => {
			const cohortContentAccessEntitlementType =
				await db.query.entitlementTypes.findFirst({
					where: eq(entitlementTypes.name, 'cohort_content_access'),
				})

			if (!cohortContentAccessEntitlementType) {
				throw new Error('cohort_content_access entitlement type not found')
			}

			return cohortContentAccessEntitlementType
		})

		// Query all purchases where productId = sourceCohortId
		const purchasesWithUsers = await step.run(
			'find-purchases-for-source-cohort',
			async () => {
				console.log('🔍 [MIGRATION] Starting purchase query', {
					sourceCohortId,
					targetCohortId,
					query: 'productId = sourceCohortId',
				})
				await log.info('cohort_entitlement_migration.step_started', {
					sourceCohortId,
					targetCohortId,
					step: 'find-purchases-for-source-cohort',
				})

				// Direct query: purchases where productId = sourceCohortId
				console.log('🔍 [MIGRATION] Querying purchases directly', {
					sourceCohortId,
					query: 'SELECT * FROM purchases WHERE productId = ?',
				})

				// First check raw purchases (no user join)
				const rawPurchases = await db
					.select({
						id: purchases.id,
						productId: purchases.productId,
						status: purchases.status,
						userId: purchases.userId,
					})
					.from(purchases)
					.where(eq(purchases.productId, sourceCohortId))

				console.log(
					'🔍 [MIGRATION] Raw purchases found (productId = sourceCohortId)',
					{
						sourceCohortId,
						totalPurchasesFound: rawPurchases.length,
						purchasesByStatus: Object.entries(
							rawPurchases.reduce(
								(acc, p) => {
									acc[p.status] = (acc[p.status] || 0) + 1
									return acc
								},
								{} as Record<string, number>,
							),
						).map(([status, count]) => ({ status, count })),
						samplePurchases: rawPurchases.slice(0, 10),
					},
				)

				// Now get purchases with user info
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
					.where(eq(purchases.productId, sourceCohortId))

				console.log('🔍 [MIGRATION] Final results (AFTER user join)', {
					sourceCohortId,
					targetCohortId,
					count: allResults.length,
					rawPurchasesCount: rawPurchases.length,
					joinedPurchasesCount: allResults.length,
					difference: rawPurchases.length - allResults.length,
					samplePurchaseIds: allResults.slice(0, 5).map((r) => r.purchaseId),
				})
				await log.info('cohort_entitlement_migration.purchases_found', {
					sourceCohortId,
					targetCohortId,
					count: allResults.length,
					rawPurchasesCount: rawPurchases.length,
					joinedPurchasesCount: allResults.length,
					samplePurchaseIds: allResults.slice(0, 5).map((r) => r.purchaseId),
				})

				if (rawPurchases.length > 0 && allResults.length === 0) {
					console.error('❌ [MIGRATION] Purchases exist but no users found!', {
						sourceCohortId,
						rawPurchasesCount: rawPurchases.length,
						purchasesWithoutUsers: rawPurchases.filter((p) => !p.userId).length,
						samplePurchasesWithoutUsers: rawPurchases
							.filter((p) => !p.userId)
							.slice(0, 5),
					})
					await log.error(
						'cohort_entitlement_migration.purchases_exist_but_no_users',
						{
							sourceCohortId,
							rawPurchasesCount: rawPurchases.length,
							purchasesWithoutUsers: rawPurchases.filter((p) => !p.userId)
								.length,
							samplePurchasesWithoutUsers: rawPurchases
								.filter((p) => !p.userId)
								.slice(0, 5),
						},
					)
				}

				return allResults
			},
		)

		if (purchasesWithUsers.length === 0) {
			await step.run('no-purchases-found', async () => {
				console.log('❌ [MIGRATION] No purchases found', {
					sourceCohortId,
					targetCohortId,
				})
				await log.info('cohort_entitlement_migration.no_purchases', {
					sourceCohortId,
					targetCohortId,
				})
			})

			return {
				sourceCohortId,
				targetCohortId,
				message: 'No purchases found for source cohort',
				totalPurchasesFound: 0,
				successCount: 0,
				errorCount: 0,
			}
		}

		// // Process each purchase
		// const results = await step.run('process-purchases', async () => {
		// 	const successResults = []
		// 	const errorResults = []

		// 	for (const purchaseData of purchasesWithUsers) {
		// 		try {
		// 			if (!purchaseData.userId) {
		// 				await log.warn('cohort_entitlement_migration.skipped_no_user', {
		// 					purchaseId: purchaseData.purchaseId,
		// 				})
		// 				errorResults.push({
		// 					purchaseId: purchaseData.purchaseId,
		// 					error: 'No userId',
		// 				})
		// 				continue
		// 			}

		// 			// Get the user
		// 			const user = await db.query.users.findFirst({
		// 				where: eq(users.id, purchaseData.userId),
		// 			})

		// 			if (!user) {
		// 				await log.warn('cohort_entitlement_migration.user_not_found', {
		// 					userId: purchaseData.userId,
		// 					purchaseId: purchaseData.purchaseId,
		// 				})
		// 				errorResults.push({
		// 					purchaseId: purchaseData.purchaseId,
		// 					userId: purchaseData.userId,
		// 					error: 'User not found',
		// 				})
		// 				continue
		// 			}

		// 			// Determine organization and membership
		// 			let organizationId: string
		// 			let organizationMembershipId: string

		// 			if (purchaseData.organizationId) {
		// 				// Purchase has an organization - get or create membership
		// 				organizationId = purchaseData.organizationId

		// 				if (purchaseData.organizationMembershipId) {
		// 					// Use existing membership
		// 					organizationMembershipId = purchaseData.organizationMembershipId
		// 				} else {
		// 					// Get or create membership
		// 					const membership =
		// 						await courseBuilderAdapter.addMemberToOrganization({
		// 							organizationId: purchaseData.organizationId,
		// 							userId: user.id,
		// 							invitedById: user.id,
		// 						})

		// 					if (!membership) {
		// 						throw new Error(
		// 							`Failed to get/create membership for user ${user.id}`,
		// 						)
		// 					}

		// 					organizationMembershipId = membership.id

		// 					// Ensure learner role
		// 					await courseBuilderAdapter.addRoleForMember({
		// 						organizationId: purchaseData.organizationId,
		// 						memberId: membership.id,
		// 						role: 'learner',
		// 					})
		// 				}
		// 			} else {
		// 				// No organization on purchase - ensure personal organization
		// 				const personalOrgResult =
		// 					await ensurePersonalOrganizationWithLearnerRole(
		// 						user,
		// 						courseBuilderAdapter,
		// 					)
		// 				organizationId = personalOrgResult.organization.id
		// 				organizationMembershipId = personalOrgResult.membership.id
		// 			}

		// 			// Create entitlement for the target cohort
		// 			const entitlementId = await createCohortEntitlement({
		// 				userId: user.id,
		// 				resourceId: targetCohortId,
		// 				organizationId,
		// 				organizationMembershipId,
		// 				entitlementType: entitlementType.id,
		// 				sourceType: EntitlementSourceType.PURCHASE,
		// 				sourceId: purchaseData.purchaseId,
		// 				metadata: {
		// 					migratedFrom: sourceCohortId,
		// 					migratedAt: new Date().toISOString(),
		// 				},
		// 			})

		// 			await log.info('cohort_entitlement_migration.entitlement_created', {
		// 				sourceCohortId,
		// 				targetCohortId,
		// 				userId: user.id,
		// 				userEmail: user.email,
		// 				purchaseId: purchaseData.purchaseId,
		// 				entitlementId,
		// 				organizationId,
		// 				organizationMembershipId,
		// 			})

		// 			successResults.push({
		// 				purchaseId: purchaseData.purchaseId,
		// 				userId: user.id,
		// 				userEmail: user.email,
		// 				entitlementId,
		// 			})
		// 		} catch (error) {
		// 			await log.error(
		// 				'cohort_entitlement_migration.entitlement_creation_error',
		// 				{
		// 					sourceCohortId,
		// 					targetCohortId,
		// 					purchaseId: purchaseData.purchaseId,
		// 					userId: purchaseData.userId,
		// 					userEmail: purchaseData.userEmail,
		// 					error: error instanceof Error ? error.message : String(error),
		// 				},
		// 			)

		// 			errorResults.push({
		// 				purchaseId: purchaseData.purchaseId,
		// 				userId: purchaseData.userId,
		// 				userEmail: purchaseData.userEmail,
		// 				error: error instanceof Error ? error.message : String(error),
		// 			})
		// 		}
		// 	}

		// 	return {
		// 		successResults,
		// 		errorResults,
		// 	}
		// })

		// await step.run('log-completion', async () => {
		// 	await log.info('cohort_entitlement_migration.completed', {
		// 		sourceCohortId,
		// 		targetCohortId,
		// 		totalPurchases: purchasesWithUsers.length,
		// 		successCount: results.successResults.length,
		// 		errorCount: results.errorResults.length,
		// 	})
		// })

		// return {
		// 	sourceCohortId,
		// 	targetCohortId,
		// 	message: `Migration completed: ${results.successResults.length}/${purchasesWithUsers.length} successful`,
		// 	successCount: results.successResults.length,
		// 	errorCount: results.errorResults.length,
		// 	totalPurchases: purchasesWithUsers.length,
		// 	errors: results.errorResults,
		// }

		await step.run('log-completion', async () => {
			console.log('✅ [MIGRATION] Query completed', {
				sourceCohortId,
				targetCohortId,
				totalPurchasesFound: purchasesWithUsers.length,
			})
			await log.info('cohort_entitlement_migration.query_completed', {
				sourceCohortId,
				targetCohortId,
				totalPurchasesFound: purchasesWithUsers.length,
			})
		})

		return {
			sourceCohortId,
			targetCohortId,
			message: `Found ${purchasesWithUsers.length} purchases for migration`,
			totalPurchasesFound: purchasesWithUsers.length,
			successCount: 0,
			errorCount: 0,
			note: 'Processing is currently commented out. Uncomment the processing code to create entitlements.',
		}
	},
)
