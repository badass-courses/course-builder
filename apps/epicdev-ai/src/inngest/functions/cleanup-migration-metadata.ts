import { db } from '@/db'
import { entitlements } from '@/db/schema'
import { COHORT_ENTITLEMENT_MIGRATION_CLEANUP_EVENT } from '@/inngest/events/cohort-entitlement-migration'
import { inngest } from '@/inngest/inngest.server'
import { log } from '@/server/logger'
import { and, eq, isNull, or, sql } from 'drizzle-orm'

/**
 * Cleanup function to remove migration metadata from existing entitlements.
 * This removes migratedFrom and migratedAt fields, keeping only contentIds.
 */
export const cleanupMigrationMetadata = inngest.createFunction(
	{
		id: 'cleanup-migration-metadata',
		name: 'Cleanup Migration Metadata from Entitlements',
	},
	{
		event: COHORT_ENTITLEMENT_MIGRATION_CLEANUP_EVENT,
	},
	async ({ step }) => {
		// Step 1: Find all entitlements that need cleanup
		const entitlementsToClean = await step.run(
			'find-entitlements-to-cleanup',
			async () => {
				const entitlementsWithMigrationData =
					await db.query.entitlements.findMany({
						where: and(
							isNull(entitlements.deletedAt),
							or(
								sql`JSON_EXTRACT(${entitlements.metadata}, '$.migratedFrom') IS NOT NULL`,
								sql`JSON_EXTRACT(${entitlements.metadata}, '$.migratedAt') IS NOT NULL`,
							),
						),
						columns: {
							id: true,
							userId: true,
							metadata: true,
						},
					})

				await log.info('cohort_entitlement_migration.cleanup_started', {
					totalEntitlementsFound: entitlementsWithMigrationData.length,
				})

				return entitlementsWithMigrationData
			},
		)

		if (entitlementsToClean.length === 0) {
			await step.run('no-entitlements-to-cleanup', async () => {
				await log.info(
					'cohort_entitlement_migration.no_entitlements_to_cleanup',
					{},
				)
				return { message: 'No entitlements to cleanup' }
			})

			return {
				message: 'No entitlements found with migration metadata',
				totalFound: 0,
				updated: 0,
				errors: 0,
			}
		}

		// Step 2: Process each entitlement in its own individual step
		const entitlementResults = await Promise.allSettled(
			entitlementsToClean.map((entitlement, index) =>
				step.run(`cleanup-entitlement-${index}-${entitlement.id}`, async () => {
					try {
						const oldMetadata = entitlement.metadata as any

						await log.info(
							'cohort_entitlement_migration.cleaning_entitlement',
							{
								entitlementId: entitlement.id,
								userId: entitlement.userId,
								oldMetadata,
							},
						)

						// Extract only contentIds, remove migratedFrom and migratedAt
						const newMetadata = {
							contentIds: oldMetadata?.contentIds || [],
						}

						// Update the entitlement
						await db
							.update(entitlements)
							.set({
								metadata: newMetadata,
							})
							.where(eq(entitlements.id, entitlement.id))

						await log.info('cohort_entitlement_migration.entitlement_cleaned', {
							entitlementId: entitlement.id,
							userId: entitlement.userId,
							newMetadata,
						})

						return {
							entitlementId: entitlement.id,
							userId: entitlement.userId,
							success: true,
							oldMetadata,
							newMetadata,
						}
					} catch (error) {
						await log.error('cohort_entitlement_migration.cleanup_error', {
							entitlementId: entitlement.id,
							userId: entitlement.userId,
							error: error instanceof Error ? error.message : String(error),
						})

						return {
							entitlementId: entitlement.id,
							userId: entitlement.userId,
							success: false,
							error: error instanceof Error ? error.message : String(error),
						}
					}
				}),
			),
		)

		// Step 3: Aggregate results from all individual steps
		const results = await step.run('aggregate-results', async () => {
			const updated: Array<{
				entitlementId: string
				userId: string | null
				oldMetadata: any
				newMetadata: any
			}> = []
			const errors: Array<{
				entitlementId: string
				userId: string | null
				error: string
			}> = []

			for (const result of entitlementResults) {
				if (result.status === 'fulfilled' && result.value) {
					if (
						result.value.success &&
						'oldMetadata' in result.value &&
						'newMetadata' in result.value
					) {
						updated.push({
							entitlementId: result.value.entitlementId,
							userId: result.value.userId,
							oldMetadata: result.value.oldMetadata,
							newMetadata: result.value.newMetadata,
						})
					} else if (!result.value.success && 'error' in result.value) {
						errors.push({
							entitlementId: result.value.entitlementId,
							userId: result.value.userId,
							error: result.value.error || 'Unknown error',
						})
					}
				} else if (result.status === 'fulfilled' && !result.value) {
					errors.push({
						entitlementId: 'unknown',
						userId: null,
						error: 'Step returned null result',
					})
				} else if (result.status === 'rejected') {
					const reason = result.reason
					errors.push({
						entitlementId: 'unknown',
						userId: null,
						error: `Step execution failed: ${reason instanceof Error ? reason.message : String(reason)}`,
					})
				}
			}

			return {
				totalFound: entitlementsToClean.length,
				updated: updated.length,
				errors: errors.length,
				updatedEntitlements: updated,
				errorDetails: errors,
			}
		})

		await step.run('log-cleanup-completion', async () => {
			await log.info('cohort_entitlement_migration.cleanup_completed', {
				totalFound: results.totalFound,
				updated: results.updated,
				errors: results.errors,
			})
			return { logged: true }
		})

		return {
			message: `Cleanup completed: ${results.updated}/${results.totalFound} entitlements updated`,
			totalFound: results.totalFound,
			updated: results.updated,
			errors: results.errors,
			errorDetails: results.errorDetails,
		}
	},
)
