import { inngest } from '@/inngest/inngest.server'
import { log } from '@/server/logger'

import { COHORT_UPDATED_EVENT } from '../inngest/events/cohort-management'

/**
 * Trigger entitlement sync when a cohort is updated
 * This should be called after any cohort modifications that affect resources
 */
export async function triggerCohortEntitlementSync(
	cohortId: string,
	changes: {
		resourcesAdded?: Array<{
			resourceId: string
			position: number
		}>
		resourcesRemoved?: Array<{
			resourceId: string
		}>
	},
) {
	try {
		await inngest.send({
			name: COHORT_UPDATED_EVENT,
			data: {
				cohortId,
				updatedAt: new Date().toISOString(),
				changes,
			},
		})

		await log.info('cohort_update_sync.triggered', {
			cohortId,
			changes,
		})
	} catch (error) {
		await log.error('cohort_update_sync.trigger_failed', {
			cohortId,
			error: error instanceof Error ? error.message : String(error),
		})
		throw error
	}
}

/**
 * Helper function to trigger sync when a resource is added to a cohort
 */
export async function triggerResourceAddedSync(
	cohortId: string,
	resourceId: string,
	position: number,
	resourceType: string,
) {
	return triggerCohortEntitlementSync(cohortId, {
		resourcesAdded: [{ resourceId, position }],
	})
}

/**
 * Helper function to trigger sync when a resource is removed from a cohort
 */
export async function triggerResourceRemovedSync(
	cohortId: string,
	resourceId: string,
) {
	return triggerCohortEntitlementSync(cohortId, {
		resourcesRemoved: [{ resourceId }],
	})
}
