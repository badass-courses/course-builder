import { inngest } from '@/inngest/inngest.server'
import { syncAllCohortEntitlements } from '@/lib/entitlement-sync'
import { log } from '@/server/logger'

import { COHORT_UPDATED_EVENT } from '../events/cohort-management'

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
