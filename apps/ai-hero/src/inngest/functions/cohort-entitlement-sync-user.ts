import { syncUserCohortEntitlementsWithIds } from '@/lib/entitlement-sync'
import { log } from '@/server/logger'

import { COHORT_ENTITLEMENT_SYNC_USER_EVENT } from '../events/cohort-management'
import { inngest } from '../inngest.server'

/**
 * Child function that syncs entitlements for a single user.
 * This is invoked via fan-out from the main cohort-entitlement-sync-workflow.
 *
 * Benefits of this fan-out pattern:
 * - Each user is processed in isolation (~1-2s per user)
 * - Automatic retries per user without affecting others
 * - No timeout risk (individual functions are fast)
 * - Better observability (see exactly which user failed)
 */
export const cohortEntitlementSyncUser = inngest.createFunction(
	{
		id: 'cohort-entitlement-sync-user',
		name: 'Sync Entitlements for Single User',
		// Limit concurrency to avoid overwhelming the database
		concurrency: {
			limit: 5,
		},
		retries: 3,
	},
	{
		event: COHORT_ENTITLEMENT_SYNC_USER_EVENT,
	},
	async ({ event, step }) => {
		const { cohortId, userId, userEmail, cohortResourceIds } = event.data

		const result = await step.run('sync-user-entitlements', async () => {
			await log.info('cohort_entitlement_sync_user.started', {
				cohortId,
				userId,
				userEmail,
				resourceCount: cohortResourceIds.length,
			})

			const syncResult = await syncUserCohortEntitlementsWithIds(
				userId,
				cohortId,
				cohortResourceIds,
			)

			await log.info('cohort_entitlement_sync_user.completed', {
				cohortId,
				userId,
				userEmail,
				entitlementsAdded: syncResult.toAdd.length,
				entitlementsRemoved: syncResult.toRemove.length,
			})

			return syncResult
		})

		return {
			userId,
			userEmail,
			cohortId,
			entitlementsAdded: result.toAdd.length,
			entitlementsRemoved: result.toRemove.length,
		}
	},
)
