import { db } from '@/db'
import {
	contentResourceProduct,
	entitlements,
	entitlementTypes,
	organizationMemberships,
	purchases,
	users,
} from '@/db/schema'
import { log } from '@/server/logger'
import { and, eq, isNull, ne, sql } from 'drizzle-orm'

import { getCohort } from './cohorts-query'
import {
	createCohortEntitlementInTransaction,
	EntitlementSourceType,
} from './entitlements'

/**
 * Find all users who have entitlements for a specific cohort.
 * Uses a single JOIN query instead of N+1 loops for performance.
 */
export async function findUsersWithCohortEntitlements(cohortId: string) {
	const cohortContentAccessEntitlementType =
		await db.query.entitlementTypes.findFirst({
			where: eq(entitlementTypes.name, 'cohort_content_access'),
		})

	if (!cohortContentAccessEntitlementType) {
		throw new Error('cohort_content_access entitlement type not found')
	}

	// Single JOIN query: entitlements -> purchases -> contentResourceProduct
	// This replaces the N+1 loop that was causing timeouts
	// Exclude refunded purchases (Valid and Restricted are both valid for entitlements)
	const results = await db
		.selectDistinct({
			userId: users.id,
			userName: users.name,
			userEmail: users.email,
		})
		.from(entitlements)
		.innerJoin(users, eq(users.id, entitlements.userId))
		.innerJoin(purchases, eq(purchases.id, entitlements.sourceId))
		.innerJoin(
			contentResourceProduct,
			eq(contentResourceProduct.productId, purchases.productId),
		)
		.where(
			and(
				eq(entitlements.sourceType, EntitlementSourceType.PURCHASE),
				eq(entitlements.entitlementType, cohortContentAccessEntitlementType.id),
				isNull(entitlements.deletedAt),
				eq(contentResourceProduct.resourceId, cohortId),
				ne(purchases.status, 'Refunded'),
			),
		)

	return results.map((row) => ({
		user: {
			id: row.userId,
			name: row.userName,
			email: row.userEmail,
		},
	}))
}

/**
 * Get all entitlements for a specific user and cohort.
 * Uses a single JOIN query instead of N+1 loops for performance.
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

	// Single JOIN query: entitlements -> purchases -> contentResourceProduct
	// Filters for specific user and cohort in one query
	const results = await db
		.select({
			id: entitlements.id,
			userId: entitlements.userId,
			sourceId: entitlements.sourceId,
			sourceType: entitlements.sourceType,
			entitlementType: entitlements.entitlementType,
			metadata: entitlements.metadata,
			expiresAt: entitlements.expiresAt,
			createdAt: entitlements.createdAt,
			deletedAt: entitlements.deletedAt,
		})
		.from(entitlements)
		.innerJoin(purchases, eq(purchases.id, entitlements.sourceId))
		.innerJoin(
			contentResourceProduct,
			eq(contentResourceProduct.productId, purchases.productId),
		)
		.where(
			and(
				eq(entitlements.userId, userId),
				eq(entitlements.sourceType, EntitlementSourceType.PURCHASE),
				eq(entitlements.entitlementType, cohortContentAccessEntitlementType.id),
				isNull(entitlements.deletedAt),
				eq(contentResourceProduct.resourceId, cohortId),
			),
		)

	return results
}

/**
 * Calculate what entitlements need to be added/removed based on current state and target resource IDs.
 */
export function calculateEntitlementChangesFromIds(
	currentEntitlements: Array<{ metadata: { contentIds?: string[] } | null }>,
	targetResourceIds: string[],
) {
	// Extract all current content IDs from all entitlements
	const currentResourceIds = new Set<string>()
	currentEntitlements.forEach((entitlement) => {
		const contentIds = entitlement.metadata?.contentIds || []
		contentIds.forEach((id: string) => {
			if (id) currentResourceIds.add(id)
		})
	})

	const updatedResourceIds = new Set<string>(
		targetResourceIds.filter((id): id is string => Boolean(id)),
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

/**
 * @deprecated Use calculateEntitlementChangesFromIds instead for better performance
 */
export function calculateEntitlementChanges(
	currentEntitlements: any[],
	updatedCohort: any,
) {
	const targetResourceIds = (
		updatedCohort.resources?.map((r: any) => r.resource.id) || []
	).filter((id: any): id is string => Boolean(id))
	return calculateEntitlementChangesFromIds(
		currentEntitlements,
		targetResourceIds,
	)
}

/**
 * Apply calculated entitlement changes for a user.
 * This is the core logic extracted for reuse.
 */
async function applyEntitlementChanges(
	userId: string,
	cohortId: string,
	changes: { toAdd: string[]; toRemove: string[] },
	startTime: number,
) {
	// If no changes, return early
	if (changes.toAdd.length === 0 && changes.toRemove.length === 0) {
		await log.info('entitlement_sync.no_changes', {
			userId,
			cohortId,
			duration: Date.now() - startTime,
		})
		return { toAdd: [], toRemove: [], updated: 0 }
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

	const organizationId: string = userMembership.organizationId

	// Get the purchase that grants access to this specific cohort
	// Must join with contentResourceProduct to ensure the purchase's product is linked to this cohort
	// Both Valid and Restricted purchases grant access (only Refunded is excluded)
	const purchaseResult = await db
		.select({
			id: purchases.id,
			userId: purchases.userId,
			productId: purchases.productId,
			status: purchases.status,
		})
		.from(purchases)
		.innerJoin(
			contentResourceProduct,
			eq(contentResourceProduct.productId, purchases.productId),
		)
		.where(
			and(
				eq(purchases.userId, userId),
				ne(purchases.status, 'Refunded'),
				eq(contentResourceProduct.resourceId, cohortId),
			),
		)
		.limit(1)

	const purchase = purchaseResult[0]

	if (!purchase) {
		throw new Error(
			`No valid purchase found for user ${userId} that grants access to cohort ${cohortId}`,
		)
	}

	await db.transaction(async (tx) => {
		// Remove entitlements for deleted content
		for (const contentId of changes.toRemove) {
			await tx
				.delete(entitlements)
				.where(
					and(
						eq(entitlements.userId, userId),
						eq(
							entitlements.entitlementType,
							cohortContentAccessEntitlementType.id,
						),
						eq(entitlements.sourceType, EntitlementSourceType.PURCHASE),
						eq(entitlements.sourceId, purchase.id),
						sql`JSON_CONTAINS(${entitlements.metadata}, ${JSON.stringify(contentId)}, '$.contentIds')`,
					),
				)
		}

		// Add entitlements for new content
		for (const contentId of changes.toAdd) {
			await createCohortEntitlementInTransaction(tx, {
				userId,
				resourceId: contentId,
				sourceId: purchase.id,
				organizationId: organizationId,
				organizationMembershipId: userMembership.id,
				entitlementType: cohortContentAccessEntitlementType.id,
				sourceType: EntitlementSourceType.PURCHASE,
				metadata: {
					contentIds: [contentId],
				},
			})
		}
	})

	await log.info('entitlement_sync.completed', {
		userId,
		cohortId,
		duration: Date.now() - startTime,
		entitlementsAdded: changes.toAdd.length,
		entitlementsRemoved: changes.toRemove.length,
	})

	return {
		toAdd: changes.toAdd,
		toRemove: changes.toRemove,
		updated: changes.toAdd.length + changes.toRemove.length,
	}
}

/**
 * Sync entitlements for a single user using pre-fetched cohort resource IDs.
 * This is the optimized version used by the fan-out child function.
 */
export async function syncUserCohortEntitlementsWithIds(
	userId: string,
	cohortId: string,
	cohortResourceIds: string[],
) {
	const startTime = Date.now()

	try {
		const currentEntitlements = await getCurrentCohortEntitlements(
			userId,
			cohortId,
		)

		// Calculate changes using pre-fetched resource IDs
		const changes = calculateEntitlementChangesFromIds(
			currentEntitlements,
			cohortResourceIds,
		)

		return await applyEntitlementChanges(userId, cohortId, changes, startTime)
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
 * Sync entitlements for a single user by fetching the cohort.
 * @deprecated Use syncUserCohortEntitlementsWithIds for fan-out pattern
 */
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

		// Calculate what needs to be added/removed
		const changes = calculateEntitlementChanges(
			currentEntitlements,
			updatedCohort,
		)

		return await applyEntitlementChanges(userId, cohortId, changes, startTime)
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
