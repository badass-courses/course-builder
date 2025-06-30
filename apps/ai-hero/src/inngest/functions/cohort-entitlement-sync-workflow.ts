import { inngest } from '@/inngest/inngest.server'
import { syncAllCohortEntitlements } from '@/lib/entitlement-sync'
import { log } from '@/server/logger'

import { COHORT_UPDATED_EVENT } from '../events/cohort-management'

/**
 * Workflow to sync entitlements when a cohort is updated
 * This ensures all users who purchased the cohort get access to new resources
 * and lose access to removed resources
 */
export const cohortEntitlementSyncWorkflow = inngest.createFunction(
	{
		id: 'cohort-entitlement-sync-workflow',
		name: 'Sync Entitlements When Cohort is Updated',
	},
	{
		event: COHORT_UPDATED_EVENT,
	},
	async ({ event, step }) => {
		const { cohortId, changes } = event.data

		await step.run('log-sync-start', async () => {
			await log.info('cohort_entitlement_sync.workflow_started', {
				cohortId,
				changes,
			})
		})

		// Only proceed if there are actual changes to resources
		if (
			(!changes.resourcesAdded || changes.resourcesAdded.length === 0) &&
			(!changes.resourcesRemoved || changes.resourcesRemoved.length === 0)
		) {
			await step.run('log-no-changes', async () => {
				await log.info('cohort_entitlement_sync.no_resource_changes', {
					cohortId,
				})
			})
			return { cohortId, message: 'No resource changes detected' }
		}

		// Sync entitlements for all users of this cohort
		const syncResult = await step.run('sync-cohort-entitlements', async () => {
			try {
				return await syncAllCohortEntitlements(cohortId)
			} catch (error) {
				await log.error('cohort_entitlement_sync.failed', {
					cohortId,
					error: error instanceof Error ? error.message : String(error),
				})
				throw error
			}
		})

		await step.run('log-sync-complete', async () => {
			await log.info('cohort_entitlement_sync.workflow_completed', {
				cohortId,
				results: {
					successful: syncResult.results.length,
					failed: syncResult.errors.length,
					totalUsersProcessed:
						syncResult.results.length + syncResult.errors.length,
				},
			})
		})

		return {
			cohortId,
			syncResult,
			message: `Entitlement sync completed for ${syncResult.results.length} users`,
		}
	},
)
