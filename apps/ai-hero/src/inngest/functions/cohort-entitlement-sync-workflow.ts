import { inngest } from '@/inngest/inngest.server'
import { getCohort } from '@/lib/cohorts-query'
import {
	findUsersWithCohortEntitlements,
	syncAllCohortEntitlements,
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
				summary: {
					totalUsers: 0,
					successful: 0,
					failed: 0,
					usersWithChanges: 0,
					successRate: '0%',
					totalEntitlementsAdded: 0,
					totalEntitlementsRemoved: 0,
					duration: Date.now() - startTime,
				},
			}
		}

		// Step 2.6: Early check - if no resource changes, skip everything
		const resourceChangeCheck = await step.run(
			'check-resource-changes',
			async () => {
				try {
					const { getCurrentCohortEntitlements, calculateEntitlementChanges } =
						await import('@/lib/entitlement-sync')

					// Check the first user's entitlements to see if there are any changes needed
					const firstUser = usersWithEntitlements[0]
					const currentEntitlements = await getCurrentCohortEntitlements(
						firstUser.user.id,
						cohortId,
					)
					const { toAdd, toRemove } = calculateEntitlementChanges(
						currentEntitlements,
						cohortInfo,
					)

					const hasChanges = toAdd.length > 0 || toRemove.length > 0

					await log.info('cohort_entitlement_sync.resource_change_check', {
						cohortId,
						cohortTitle: cohortInfo.cohortTitle,
						hasChanges,
						resourcesToAdd: toAdd.length,
						resourcesToRemove: toRemove.length,
					})

					return { hasChanges, toAdd, toRemove }
				} catch (error) {
					await log.error(
						'cohort_entitlement_sync.resource_change_check_failed',
						{
							cohortId,
							error: error instanceof Error ? error.message : String(error),
						},
					)
					// If we can't check, assume there might be changes and continue
					return { hasChanges: true, toAdd: [], toRemove: [] }
				}
			},
		)

		if (!resourceChangeCheck.hasChanges) {
			await step.run('early-exit-no-changes', async () => {
				await log.info('cohort_entitlement_sync.early_exit_no_changes', {
					cohortId,
					cohortTitle: cohortInfo.cohortTitle,
					reason:
						'No resource changes detected - all users already have correct entitlements',
					usersCount: usersWithEntitlements.length,
					duration: Date.now() - startTime,
				})
			})

			return {
				cohortId,
				cohortTitle: cohortInfo.cohortTitle,
				message: 'No resource changes detected - sync skipped',
				summary: {
					totalUsers: usersWithEntitlements.length,
					successful: usersWithEntitlements.length,
					failed: 0,
					usersWithChanges: 0,
					successRate: '100%',
					totalEntitlementsAdded: 0,
					totalEntitlementsRemoved: 0,
					duration: Date.now() - startTime,
				},
			}
		}

		// Step 3: Sync entitlements for each user
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

					const { syncUserCohortEntitlements } = await import(
						'@/lib/entitlement-sync'
					)
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

		// Step 4: Calculate summary statistics
		const summary = await step.run('calculate-summary', async () => {
			const totalUsers = usersWithEntitlements.length
			const successful = syncResults.results.length
			const failed = syncResults.errors.length
			const usersWithChanges = syncResults.results.filter(
				(r) => r.toAdd.length > 0 || r.toRemove.length > 0,
			).length
			const totalEntitlementsAdded = syncResults.results.reduce(
				(sum, r) => sum + r.toAdd.length,
				0,
			)
			const totalEntitlementsRemoved = syncResults.results.reduce(
				(sum, r) => sum + r.toRemove.length,
				0,
			)

			await log.info('cohort_entitlement_sync.summary_calculated', {
				cohortId,
				cohortTitle: cohortInfo.cohortTitle,
				totalUsers,
				successful,
				failed,
				usersWithChanges,
				successRate:
					totalUsers > 0
						? ((successful / totalUsers) * 100).toFixed(2) + '%'
						: '0%',
				totalEntitlementsAdded,
				totalEntitlementsRemoved,
				duration: Date.now() - startTime,
			})

			return {
				totalUsers,
				successful,
				failed,
				usersWithChanges,
				successRate:
					totalUsers > 0
						? ((successful / totalUsers) * 100).toFixed(2) + '%'
						: '0%',
				totalEntitlementsAdded,
				totalEntitlementsRemoved,
				duration: Date.now() - startTime,
			}
		})

		// Step 5: Final completion log
		await step.run('log-sync-complete', async () => {
			await log.info('cohort_entitlement_sync.workflow_completed', {
				cohortId,
				cohortTitle: cohortInfo.cohortTitle,
				summary,
				changes,
				totalDuration: Date.now() - startTime,
			})
		})

		return {
			cohortId,
			cohortTitle: cohortInfo.cohortTitle,
			syncResults,
			summary,
			message: `Entitlement sync completed for ${summary.successful}/${summary.totalUsers} users (${summary.successRate} success rate)`,
		}
	},
)
