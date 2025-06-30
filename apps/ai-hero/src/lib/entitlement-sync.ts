import { db } from '@/db'
import {
	entitlements,
	entitlementTypes,
	organizationMemberships,
} from '@/db/schema'
import { log } from '@/server/logger'
import { and, eq, isNull, or, sql } from 'drizzle-orm'

import { guid } from '@coursebuilder/adapter-drizzle/mysql'

import { getCohort } from './cohorts-query'

/**
 * Find all users who have entitlements for a specific cohort
 */
export async function findUsersWithCohortEntitlements(cohortId: string) {
	const cohortContentAccessEntitlementType =
		await db.query.entitlementTypes.findFirst({
			where: eq(entitlementTypes.name, 'cohort_content_access'),
		})

	if (!cohortContentAccessEntitlementType) {
		throw new Error('cohort_content_access entitlement type not found')
	}

	// Find all entitlements for this cohort
	const cohortEntitlements = await db.query.entitlements.findMany({
		where: and(
			eq(entitlements.sourceType, 'cohort'),
			eq(entitlements.sourceId, cohortId),
			eq(entitlements.entitlementType, cohortContentAccessEntitlementType.id),
			isNull(entitlements.deletedAt),
		),
		with: {
			user: true,
			organization: true,
			membership: true,
		},
	})

	// Group by user to avoid duplicates
	const uniqueUsers = new Map()
	cohortEntitlements.forEach((entitlement) => {
		if (entitlement.user && entitlement.userId) {
			uniqueUsers.set(entitlement.userId, {
				user: entitlement.user,
				entitlements: cohortEntitlements.filter(
					(e) => e.userId === entitlement.userId,
				),
			})
		}
	})

	return Array.from(uniqueUsers.values())
}

/**
 * Get current entitlements for a user and cohort
 */
export async function getCurrentCohortEntitlements(
	userId: string,
	cohortId: string,
) {
	const cohortContentAccessEntitlementType =
		await db.query.entitlementTypes.findFirst({
			where: eq(entitlementTypes.name, 'cohort_content_access'),
		})

	if (!cohortContentAccessEntitlementType) {
		return []
	}

	return await db.query.entitlements.findMany({
		where: and(
			eq(entitlements.userId, userId),
			eq(entitlements.sourceType, 'cohort'),
			eq(entitlements.sourceId, cohortId),
			eq(entitlements.entitlementType, cohortContentAccessEntitlementType.id),
			isNull(entitlements.deletedAt),
		),
	})
}

/**
 * Calculate what entitlements need to be added, removed, or updated
 */
export function calculateEntitlementChanges(
	currentEntitlements: any[],
	updatedCohort: any,
) {
	const currentResourceIds = new Set(
		currentEntitlements
			.map((e) => e.metadata?.contentIds?.[0])
			.filter((id): id is string => Boolean(id)),
	)
	const updatedResourceIds = new Set(
		(updatedCohort.resources?.map((r: any) => r.resource.id) || []).filter(
			(id): id is string => Boolean(id),
		),
	)

	const toAdd: string[] = []
	const toRemove: string[] = []

	// Find resources that need new entitlements
	updatedResourceIds.forEach((resourceId) => {
		if (!currentResourceIds.has(resourceId)) {
			toAdd.push(resourceId)
		}
	})

	// Find entitlements that should be removed (resources no longer in cohort)
	currentResourceIds.forEach((resourceId) => {
		if (!updatedResourceIds.has(resourceId)) {
			toRemove.push(resourceId)
		}
	})

	return { toAdd, toRemove }
}

/**
 * Sync entitlements for a specific user and cohort
 */
export async function syncUserCohortEntitlements(
	userId: string,
	cohortId: string,
) {
	const startTime = Date.now()

	try {
		// Get current entitlements
		const currentEntitlements = await getCurrentCohortEntitlements(
			userId,
			cohortId,
		)

		// Get updated cohort structure
		const updatedCohort = await getCohort(cohortId)
		if (!updatedCohort) {
			throw new Error(`Cohort ${cohortId} not found`)
		}

		// Calculate changes needed
		const { toAdd, toRemove } = calculateEntitlementChanges(
			currentEntitlements,
			updatedCohort,
		)

		if (toAdd.length === 0 && toRemove.length === 0) {
			await log.info('entitlement_sync.no_changes', {
				userId,
				cohortId,
				duration: Date.now() - startTime,
			})
			return { toAdd: [], toRemove: [], toUpdate: [] }
		}

		// Get entitlement type
		const cohortContentAccessEntitlementType =
			await db.query.entitlementTypes.findFirst({
				where: eq(entitlementTypes.name, 'cohort_content_access'),
			})

		if (!cohortContentAccessEntitlementType) {
			throw new Error('cohort_content_access entitlement type not found')
		}

		// Get user's organization membership
		const userMembership = await db.query.organizationMemberships.findFirst({
			where: eq(organizationMemberships.userId, userId),
		})

		if (!userMembership) {
			throw new Error(`No organization membership found for user ${userId}`)
		}

		// Apply changes in a transaction
		await db.transaction(async (tx) => {
			// Remove entitlements for resources that no longer exist in the cohort
			for (const resourceId of toRemove) {
				await tx
					.delete(entitlements)
					.where(
						and(
							eq(entitlements.userId, userId),
							eq(entitlements.sourceType, 'cohort'),
							eq(entitlements.sourceId, cohortId),
							eq(
								entitlements.entitlementType,
								cohortContentAccessEntitlementType.id,
							),
							sql`JSON_EXTRACT(${entitlements.metadata}, '$.contentIds[0]') = ${resourceId}`,
						),
					)
			}

			// Add entitlements for new resources
			for (const resourceId of toAdd) {
				const entitlementId = `${resourceId}-${guid()}`
				await tx.insert(entitlements).values({
					id: entitlementId,
					entitlementType: cohortContentAccessEntitlementType.id,
					sourceType: 'cohort',
					sourceId: cohortId,
					userId,
					organizationId: userMembership.organizationId,
					organizationMembershipId: userMembership.id,
					metadata: {
						contentIds: [resourceId],
					},
				})
			}
		})

		await log.info('entitlement_sync.completed', {
			userId,
			cohortId,
			duration: Date.now() - startTime,
			changesApplied: { toAdd, toRemove },
		})

		return { toAdd, toRemove, toUpdate: [] }
	} catch (error) {
		await log.error('entitlement_sync.failed', {
			userId,
			cohortId,
			error: error instanceof Error ? error.message : String(error),
			duration: Date.now() - startTime,
		})
		throw error
	}
}

/**
 * Sync entitlements for all users of a cohort
 */
export async function syncAllCohortEntitlements(cohortId: string) {
	const startTime = Date.now()

	try {
		// Find all users with entitlements for this cohort
		const usersWithEntitlements =
			await findUsersWithCohortEntitlements(cohortId)

		await log.info('entitlement_sync.started', {
			cohortId,
			usersToSync: usersWithEntitlements.length,
		})

		const results = []
		const errors = []

		// Sync entitlements for each user
		for (const { user } of usersWithEntitlements) {
			try {
				const result = await syncUserCohortEntitlements(user.id, cohortId)
				results.push({ userId: user.id, ...result })
			} catch (error) {
				errors.push({
					userId: user.id,
					error: error instanceof Error ? error.message : String(error),
				})
			}
		}

		await log.info('entitlement_sync.batch_completed', {
			cohortId,
			duration: Date.now() - startTime,
			successful: results.length,
			failed: errors.length,
			errors,
		})

		return { results, errors }
	} catch (error) {
		await log.error('entitlement_sync.batch_failed', {
			cohortId,
			error: error instanceof Error ? error.message : String(error),
			duration: Date.now() - startTime,
		})
		throw error
	}
}
