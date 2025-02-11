import { db } from '@/db'
import { entitlements, organizationMemberships, purchases } from '@/db/schema'
import { and, eq, gt, isNull, or, sql } from 'drizzle-orm'

export type EntitlementType =
	| 'cohort_content_access'
	| 'cohort_discord_role'
	| 'subscription_tier'

export type EntitlementSource =
	| { type: 'PURCHASE'; id: string }
	| { type: 'SUBSCRIPTION'; id: string }
	| { type: 'MANUAL'; id: string }

export async function getActiveEntitlements(organizationId: string) {
	return db.query.entitlements.findMany({
		where: and(
			eq(entitlements.organizationId, organizationId),
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

export async function allocateEntitlementToMember(
	organizationId: string,
	memberId: string,
	entitlementType: EntitlementType,
	source: EntitlementSource,
) {
	return db.transaction(async (tx) => {
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
}

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
