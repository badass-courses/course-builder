import { db } from '@/db'
import { entitlements, organizationMemberships, purchases } from '@/db/schema'
import { and, eq, gt, isNull, or, sql } from 'drizzle-orm'

import { guid } from '@coursebuilder/adapter-drizzle/mysql'

export type EntitlementType =
	| 'cohort_content_access'
	| 'cohort_discord_role'
	| 'subscription_tier'

export type EntitlementSource =
	| { type: 'PURCHASE'; id: string }
	| { type: 'SUBSCRIPTION'; id: string }
	| { type: 'MANUAL'; id: string }

/**
 * Get all active entitlements for an organization member
 * @param organizationMembershipId - The ID of the organization membership to get entitlements for
 * @returns An array of entitlements
 */
export async function getActiveEntitlements(organizationMembershipId: string) {
	return await db.query.entitlements.findMany({
		where: and(
			eq(entitlements.organizationMembershipId, organizationMembershipId),
			or(
				isNull(entitlements.expiresAt),
				gt(entitlements.expiresAt, sql`CURRENT_TIMESTAMP`),
			),
			isNull(entitlements.deletedAt),
		),
		columns: {
			entitlementType: true,
			expiresAt: true,
			metadata: true,
		},
	})
}

/**
 * Allocate an entitlement to an organization member
 * @param organizationId - The ID of the organization to allocate the entitlement to
 * @param memberId - The ID of the organization member to allocate the entitlement to
 * @param entitlementType - The type of entitlement to allocate
 * @param source - The source of the entitlement
 */
export async function allocateEntitlementToMember(
	organizationId: string,
	memberId: string,
	entitlementType: EntitlementType,
	source: EntitlementSource,
) {
	await db.transaction(async (tx) => {
		const membership = await tx.query.organizationMemberships.findFirst({
			where: and(
				eq(organizationMemberships.organizationId, organizationId),
				eq(organizationMemberships.id, memberId),
			),
		})

		if (!membership) {
			throw new Error('Invalid membership')
		}

		const purchaseId = source.type === 'PURCHASE' ? source.id : null
		if (!purchaseId) {
			throw new Error('Invalid source for allocation')
		}

		const purchase = await tx.query.purchases.findFirst({
			where: eq(purchases.id, purchaseId),
		})

		if (!purchase?.fields?.seats) {
			throw new Error('Purchase does not have seat information')
		}

		const allocatedEntitlementsCount = await tx.query.entitlements
			.findMany({
				where: and(
					eq(entitlements.organizationId, organizationId),
					eq(entitlements.entitlementType, entitlementType),
					eq(entitlements.sourceId, purchaseId),
				),
			})
			.then((ents) => ents.length)

		if (allocatedEntitlementsCount >= purchase.fields.seats) {
			throw new Error('No available seats for this purchase')
		}

		await tx.insert(entitlements).values({
			id: crypto.randomUUID(),
			organizationMembershipId: memberId,
			organizationId: organizationId,
			userId: membership.userId,
			entitlementType: entitlementType,
			sourceType: source.type,
			sourceId: source.id,
			metadata: {
				allocatedBy: 'admin',
				allocatedAt: new Date().toISOString(),
			},
		})
	})
	return await getActiveEntitlements(memberId)
}

/**
 * Validate that a membership has an entitlement
 * @param membershipId - The ID of the organization membership to validate the entitlement for
 * @param type - The type of entitlement to validate
 * @returns True if the membership has the entitlement, false otherwise
 */
export async function validateMembershipEntitlement(
	membershipId: string,
	type: EntitlementType,
) {
	return db.query.entitlements.findFirst({
		where: and(
			eq(entitlements.organizationMembershipId, membershipId),
			eq(entitlements.entitlementType, type),
			or(
				isNull(entitlements.expiresAt),
				gt(entitlements.expiresAt, sql`CURRENT_TIMESTAMP`),
			),
		),
	})
}

/**
 * Validate that a purchase has available seats
 *
 * TODO: this isn't something we have modeled. It uses seats below but that
 * isn't actually stored.
 *
 * @param organizationId - The ID of the organization to validate the entitlement for
 * @param purchaseId - The ID of the purchase to validate the entitlement for
 * @param entitlementType - The type of entitlement to validate
 * @returns True if the purchase has available seats, false otherwise
 */
export async function hasAvailableSeatsForPurchase(
	organizationId: string,
	purchaseId: string,
	entitlementType: EntitlementType,
): Promise<boolean> {
	const purchase = await db.query.purchases.findFirst({
		where: eq(purchases.id, purchaseId),
	})

	if (!purchase?.fields?.seats) {
		return false
	}

	const allocatedEntitlementsCount = await db.query.entitlements
		.findMany({
			where: and(
				eq(entitlements.organizationId, organizationId),
				eq(entitlements.entitlementType, entitlementType),
				eq(entitlements.sourceId, purchaseId),
			),
		})
		.then((ents) => ents.length)

	return allocatedEntitlementsCount < purchase.fields.seats
}

/**
 * Creates a cohort entitlement for a user for a specific resource in a cohort.
 * This should be used by all flows (purchase, transfer, redeem, etc.)
 * @returns The ID of the created entitlement
 */
export async function createCohortEntitlement({
	userId,
	resourceId,
	sourceId,
	organizationId,
	organizationMembershipId,
	entitlementType,
	sourceType,
	metadata = {},
}: {
	userId: string
	resourceId: string
	organizationId: string
	organizationMembershipId: string
	entitlementType: string
	sourceId: string
	sourceType: string
	metadata?: Record<string, any>
}): Promise<string> {
	const entitlementId = `${resourceId}-${guid()}`
	await db.insert(entitlements).values({
		id: entitlementId,
		entitlementType,
		userId,
		organizationId,
		organizationMembershipId,
		sourceType,
		sourceId,
		metadata: {
			...metadata,
			contentIds: [resourceId],
		},
	})
	return entitlementId
}
