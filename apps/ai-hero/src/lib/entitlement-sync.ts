import { courseBuilderAdapter, db } from '@/db'
import {
	entitlements,
	entitlementTypes,
	organizationMemberships,
	products,
	purchases,
} from '@/db/schema'
import { log } from '@/server/logger'
import { and, eq, isNull, or, sql } from 'drizzle-orm'

import { guid } from '@coursebuilder/adapter-drizzle/mysql'

import { getCohort } from './cohorts-query'
import {
	createCohortEntitlementInTransaction,
	EntitlementSourceType,
} from './entitlements'

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
			eq(entitlements.sourceType, EntitlementSourceType.PURCHASE),
			eq(entitlements.entitlementType, cohortContentAccessEntitlementType.id),
			isNull(entitlements.deletedAt),
		),
		with: {
			user: {
				columns: {
					id: true,
					name: true,
					email: true,
				},
			},
		},
	})

	// Filter entitlements that belong to this cohort via the relationship chain
	const cohortEntitlementsForCohort = []
	for (const entitlement of cohortEntitlements) {
		// Get the purchase for this entitlement
		const purchase = await db.query.purchases.findFirst({
			where: eq(purchases.id, entitlement.sourceId),
		})

		// Skip if purchase not found
		if (!purchase) {
			continue
		}

		// Get the product for this purchase
		const product = await courseBuilderAdapter.getProduct(purchase.productId)

		if (!product) {
			continue
		}

		// Check if this product has the cohort as a resource
		const hasCohortResource = product.resources?.some(
			(resource: any) => resource.resource?.id === cohortId,
		)

		if (hasCohortResource) {
			cohortEntitlementsForCohort.push(entitlement)
		}
	}

	const uniqueUsers = new Map()
	cohortEntitlementsForCohort.forEach((entitlement) => {
		if (entitlement.user && entitlement.userId) {
			uniqueUsers.set(entitlement.userId, {
				user: {
					id: entitlement.user.id,
					name: entitlement.user.name,
					email: entitlement.user.email,
				},
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

	const userEntitlements = await db.query.entitlements.findMany({
		where: and(
			eq(entitlements.userId, userId),
			eq(entitlements.sourceType, EntitlementSourceType.PURCHASE),
			eq(entitlements.entitlementType, cohortContentAccessEntitlementType.id),
			isNull(entitlements.deletedAt),
		),
	})

	// Filter entitlements that belong to this cohort
	const cohortEntitlementsForUser = []
	for (const entitlement of userEntitlements) {
		// Get the purchase for this entitlement
		const purchase = await db.query.purchases.findFirst({
			where: eq(purchases.id, entitlement.sourceId),
		})

		// Skip if purchase not found
		if (!purchase) {
			continue
		}

		// Get the product for this purchase
		const product = await courseBuilderAdapter.getProduct(purchase.productId)

		if (!product) {
			continue
		}

		// Check if this product has the cohort as a resource
		const hasCohortResource = product.resources?.some(
			(resource: any) => resource.resource?.id === cohortId,
		)

		if (hasCohortResource) {
			cohortEntitlementsForUser.push(entitlement)
		}
	}

	return cohortEntitlementsForUser
}

export function calculateEntitlementChanges(
	currentEntitlements: any[],
	updatedCohort: any,
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

		// Calculate what needs to be added/removed
		const changes = calculateEntitlementChanges(
			currentEntitlements,
			updatedCohort,
		)

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

		// Get the purchase for this user's cohort access
		const purchase = await db.query.purchases.findFirst({
			where: and(eq(purchases.userId, userId), eq(purchases.status, 'Valid')),
		})

		if (!purchase) {
			throw new Error(`No valid purchase found for user ${userId}`)
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
