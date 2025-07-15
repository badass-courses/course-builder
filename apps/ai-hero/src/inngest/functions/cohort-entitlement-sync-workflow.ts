import { inngest } from '@/inngest/inngest.server'
import { getCohort } from '@/lib/cohorts-query'
import {
	findUsersWithCohortEntitlements,
	syncUserCohortEntitlements,
} from '@/lib/entitlement-sync'
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
		const startTime = Date.now()

		const cohortInfo = await step.run('validate-cohort', async () => {
			try {
				const cohort = await getCohort(cohortId)

				if (!cohort) {
					throw new Error(`Cohort ${cohortId} not found`)
				}

				await log.info('cohort_entitlement_sync.cohort_validated', {
					cohortId,
					cohortTitle: cohort.fields?.title || 'Unknown',
					resourceCount: cohort.resources?.length || 0,
				})

				return {
					cohortTitle: cohort.fields?.title || 'Unknown',
					resourceCount: cohort.resources?.length || 0,
					cohort,
				}
			} catch (error) {
				await log.error('cohort_entitlement_sync.cohort_validation_failed', {
					cohortId,
					error: error instanceof Error ? error.message : String(error),
				})
				throw error
			}
		})

		const usersWithEntitlements = await step.run(
			'find-users-with-entitlements',
			async () => {
				try {
					const users = await findUsersWithCohortEntitlements(cohortId)

					await log.info('cohort_entitlement_sync.users_found', {
						cohortId,
						count: users.length,
						users: users.map((u) => ({
							name: u.user.name || 'Unknown',
							email: u.user.email,
						})),
					})

					return users
				} catch (error) {
					await log.error('cohort_entitlement_sync.find_users_failed', {
						cohortId,
						error: error instanceof Error ? error.message : String(error),
					})
					throw error
				}
			},
		)

		if (usersWithEntitlements.length === 0) {
			await step.run('early-exit-no-users', async () => {
				await log.info('cohort_entitlement_sync.early_exit_no_users', {
					cohortId,
					cohortTitle: cohortInfo.cohortTitle,
					reason: 'No users with entitlements found for this cohort',
					duration: Date.now() - startTime,
				})
			})

			return {
				cohortId,
				cohortTitle: cohortInfo.cohortTitle,
				message: 'No users with entitlements found - sync skipped',
			}
		}

		const syncResults = await step.run('sync-individual-users', async () => {
			const results = []
			const errors = []

			for (const [index, { user }] of usersWithEntitlements.entries()) {
				try {
					await log.info('cohort_entitlement_sync.user_sync_started', {
						cohortId,
						userId: user.id,
						userEmail: user.email,
						userIndex: index + 1,
						totalUsers: usersWithEntitlements.length,
					})

					const result = await syncUserCohortEntitlements(user.id, cohortId)

					await log.info('cohort_entitlement_sync.user_sync_completed', {
						cohortId,
						userId: user.id,
						userEmail: user.email,
						entitlementsAdded: result.toAdd.length,
						entitlementsRemoved: result.toRemove.length,
						changesApplied: result,
					})

					results.push({ userId: user.id, userEmail: user.email, ...result })
				} catch (error) {
					await log.error('cohort_entitlement_sync.user_sync_failed', {
						cohortId,
						userId: user.id,
						userEmail: user.email,
						error: error instanceof Error ? error.message : String(error),
					})

					errors.push({
						userId: user.id,
						userEmail: user.email,
						error: error instanceof Error ? error.message : String(error),
					})
				}
			}

			return { results, errors }
		})

		return {
			cohortId,
			cohortTitle: cohortInfo.cohortTitle,
			message: `Entitlement sync completed for ${syncResults.results.length}/${usersWithEntitlements.length} users`,
		}
	},
)
