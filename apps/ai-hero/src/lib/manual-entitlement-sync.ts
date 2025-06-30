import { log } from '@/server/logger'

import { syncAllCohortEntitlements } from './entitlement-sync'

/**
 * Manual sync function that can be called by admins
 * This is useful for testing or fixing entitlement issues
 */
export async function manualCohortEntitlementSync(
	cohortId: string,
	adminUserId: string,
) {
	const startTime = Date.now()

	try {
		await log.info('manual_entitlement_sync.started', {
			cohortId,
			adminUserId,
		})

		const result = await syncAllCohortEntitlements(cohortId)

		await log.info('manual_entitlement_sync.completed', {
			cohortId,
			adminUserId,
			duration: Date.now() - startTime,
			results: {
				successful: result.results.length,
				failed: result.errors.length,
				totalUsersProcessed: result.results.length + result.errors.length,
			},
		})

		return result
	} catch (error) {
		await log.error('manual_entitlement_sync.failed', {
			cohortId,
			adminUserId,
			error: error instanceof Error ? error.message : String(error),
			duration: Date.now() - startTime,
		})
		throw error
	}
}

/**
 * Get a summary of entitlement sync status for a cohort
 */
export async function getCohortEntitlementSyncStatus(cohortId: string) {
	try {
		const { findUsersWithCohortEntitlements } = await import(
			'./entitlement-sync'
		)
		const usersWithEntitlements =
			await findUsersWithCohortEntitlements(cohortId)

		return {
			cohortId,
			totalUsers: usersWithEntitlements.length,
			lastChecked: new Date().toISOString(),
		}
	} catch (error) {
		await log.error('cohort_entitlement_sync.status_check_failed', {
			cohortId,
			error: error instanceof Error ? error.message : String(error),
		})
		throw error
	}
}
