import { inngest } from '@/inngest/inngest.server'
import { getCohort } from '@/lib/cohorts-query'
import { findUsersWithCohortEntitlements } from '@/lib/entitlement-sync'
import { log } from '@/server/logger'

import {
	COHORT_ENTITLEMENT_SYNC_USER_EVENT,
	COHORT_UPDATED_EVENT,
} from '../events/cohort-management'

/**
 * Main orchestrator workflow that handles cohort updates.
 * Uses fan-out pattern to process each user in parallel via separate child functions.
 *
 * Architecture:
 * 1. Validate cohort and extract resource IDs (~1-2s)
 * 2. Find all users with entitlements (single batched query, ~1-2s)
 * 3. Fan-out one event per user (processed in parallel by child functions)
 *
 * This ensures the orchestrator completes quickly (~5s) regardless of user count,
 * while each user is processed reliably with individual retries.
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
		const startTime = Date.now()

		// Early exit if no actual resource changes
		const hasResourceChanges =
			(changes?.resourcesAdded?.length ?? 0) > 0 ||
			(changes?.resourcesRemoved?.length ?? 0) > 0

		if (!hasResourceChanges) {
			await log.info('cohort_entitlement_sync.no_resource_changes', {
				cohortId,
				reason: 'No resources added or removed - skipping sync',
				duration: Date.now() - startTime,
			})

			return {
				cohortId,
				cohortTitle: 'Unknown',
				usersProcessed: 0,
				message: 'No resource changes detected - sync skipped',
			}
		}

		// Step 1: Validate cohort and extract resource IDs
		const cohortInfo = await step.run('validate-cohort', async () => {
			const cohort = await getCohort(cohortId)

			if (!cohort) {
				throw new Error(`Cohort ${cohortId} not found`)
			}

			// Extract resource IDs to pass to child functions
			const resourceIds = (cohort.resources || [])
				.map((r) => r.resource?.id)
				.filter((id): id is string => Boolean(id))

			await log.info('cohort_entitlement_sync.cohort_validated', {
				cohortId,
				cohortTitle: cohort.fields?.title || 'Unknown',
				resourceCount: resourceIds.length,
			})

			return {
				cohortTitle: cohort.fields?.title || 'Unknown',
				resourceIds,
			}
		})

		// Step 2: Find all users with entitlements (optimized batched query)
		const usersWithEntitlements = await step.run(
			'find-users-with-entitlements',
			async () => {
				const users = await findUsersWithCohortEntitlements(cohortId)

				await log.info('cohort_entitlement_sync.users_found', {
					cohortId,
					count: users.length,
				})

				return users
			},
		)

		// Early exit if no users
		if (usersWithEntitlements.length === 0) {
			await log.info('cohort_entitlement_sync.early_exit_no_users', {
				cohortId,
				cohortTitle: cohortInfo.cohortTitle,
				reason: 'No users with entitlements found for this cohort',
				duration: Date.now() - startTime,
			})

			return {
				cohortId,
				cohortTitle: cohortInfo.cohortTitle,
				usersProcessed: 0,
				message: 'No users with entitlements found - sync skipped',
			}
		}

		// Step 3: Fan-out events for each user in batches
		// Inngest has payload size limits, so we batch to avoid hitting them
		const BATCH_SIZE = 100
		const batches = []
		for (let i = 0; i < usersWithEntitlements.length; i += BATCH_SIZE) {
			batches.push(usersWithEntitlements.slice(i, i + BATCH_SIZE))
		}

		for (const [batchIndex, batch] of batches.entries()) {
			await step.sendEvent(
				`fan-out-user-sync-events-batch-${batchIndex}`,
				batch.map(({ user }) => ({
					name: COHORT_ENTITLEMENT_SYNC_USER_EVENT,
					data: {
						cohortId,
						userId: user.id,
						userEmail: user.email,
						cohortResourceIds: cohortInfo.resourceIds,
					},
				})),
			)
		}

		await log.info('cohort_entitlement_sync.fanout_completed', {
			cohortId,
			cohortTitle: cohortInfo.cohortTitle,
			usersQueued: usersWithEntitlements.length,
			duration: Date.now() - startTime,
		})

		return {
			cohortId,
			cohortTitle: cohortInfo.cohortTitle,
			usersProcessed: usersWithEntitlements.length,
			message: `Queued ${usersWithEntitlements.length} user sync events`,
		}
	},
)
