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
import { createCohortEntitlementInTransaction } from './entitlements'

export async function findUsersWithCohortEntitlements(cohortId: string) {
	const cohortContentAccessEntitlementType =
		await db.query.entitlementTypes.findFirst({
			where: eq(entitlementTypes.name, 'cohort_content_access'),
		})

	if (!cohortContentAccessEntitlementType) {
		throw new Error('cohort_content_access entitlement type not found')
	}

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

export function calculateEntitlementChanges(
	currentEntitlements: any[],
	updatedCohort: any,
) {
	const currentResourceIds = new Set<string>(
		currentEntitlements
			.map((e) => e.metadata?.contentIds?.[0])
			.filter((id): id is string => Boolean(id)),
	)
	const updatedResourceIds = new Set<string>(
		(updatedCohort.resources?.map((r: any) => r.resource.id) || []).filter(
			(id: any): id is string => Boolean(id),
		),
	)

	const toAdd: string[] = []
	const toRemove: string[] = []

	updatedResourceIds.forEach((resourceId: string) => {
		if (!currentResourceIds.has(resourceId)) {
			toAdd.push(resourceId)
		}
	})

	currentResourceIds.forEach((resourceId: string) => {
		if (!updatedResourceIds.has(resourceId)) {
			toRemove.push(resourceId)
		}
	})

	return { toAdd, toRemove }
}

export async function syncUserCohortEntitlements(
	userId: string,
	cohortId: string,
) {
	const startTime = Date.now()

	try {
		const currentEntitlements = await getCurrentCohortEntitlements(
			userId,
			cohortId,
		)

		const updatedCohort = await getCohort(cohortId)
		if (!updatedCohort) {
			throw new Error(`Cohort ${cohortId} not found`)
		}

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
			return { toAdd: [], toRemove: [] }
		}

		const cohortContentAccessEntitlementType =
			await db.query.entitlementTypes.findFirst({
				where: eq(entitlementTypes.name, 'cohort_content_access'),
			})

		if (!cohortContentAccessEntitlementType) {
			throw new Error('cohort_content_access entitlement type not found')
		}

		const userMembership = await db.query.organizationMemberships.findFirst({
			where: eq(organizationMemberships.userId, userId),
		})

		if (!userMembership) {
			throw new Error(`No organization membership found for user ${userId}`)
		}

		if (!userMembership.organizationId) {
			throw new Error(`No organization ID found for user ${userId}`)
		}

		await db.transaction(async (tx) => {
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

			for (const resourceId of toAdd) {
				await createCohortEntitlementInTransaction(tx, {
					userId,
					resourceId,
					sourceId: cohortId,
					organizationId: userMembership.organizationId!,
					organizationMembershipId: userMembership.id,
					entitlementType: cohortContentAccessEntitlementType.id,
					sourceType: 'cohort',
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

		return { toAdd, toRemove }
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

export async function syncAllCohortEntitlements(cohortId: string) {
	const startTime = Date.now()

	try {
		const usersWithEntitlements =
			await findUsersWithCohortEntitlements(cohortId)

		await log.info('entitlement_sync.started', {
			cohortId,
			usersToSync: usersWithEntitlements.length,
		})

		const results = []
		const errors = []

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
