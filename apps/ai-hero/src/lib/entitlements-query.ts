import { db } from '@/db'
import {
	entitlements,
	entitlementTypes,
	organizationMemberships,
} from '@/db/schema'
import {
	PRODUCT_TYPE_CONFIG,
	type ProductType,
} from '@/inngest/config/product-types'
import { EntitlementSourceType } from '@/lib/entitlements'
import { and, eq, gt, inArray, isNull, or, sql } from 'drizzle-orm'

/**
 * Get all active entitlements for a user across all their organizations
 * Excludes soft-deleted entitlements
 */
export async function getAllUserEntitlements(userId: string) {
	// Get all organization memberships for the user
	const allMemberships = await db.query.organizationMemberships.findMany({
		where: eq(organizationMemberships.userId, userId),
	})

	const allMembershipIds = allMemberships.map((m) => m.id)

	// Load entitlements from ALL user organizations
	const activeEntitlements =
		allMembershipIds.length > 0
			? await db.query.entitlements.findMany({
					where: and(
						inArray(entitlements.organizationMembershipId, allMembershipIds),
						or(
							isNull(entitlements.expiresAt),
							gt(entitlements.expiresAt, sql`CURRENT_TIMESTAMP`),
						),
						isNull(entitlements.deletedAt),
					),
				})
			: []

	return activeEntitlements
}

/**
 * Create resource entitlements based on product type
 * Shared logic used by post-purchase and transfer workflows
 */
export async function createResourceEntitlements(
	productType: ProductType,
	resource: any,
	params: {
		user: any
		purchase: any
		organizationId: string
		orgMembership: any
		contentAccessEntitlementType: any
	},
) {
	const {
		user,
		purchase,
		organizationId,
		orgMembership,
		contentAccessEntitlementType,
	} = params
	const config = PRODUCT_TYPE_CONFIG[productType]
	const createdEntitlements: Array<{
		entitlementId: string
		resourceId: string
		resourceType: string
		resourceTitle?: string
	}> = []

	if (productType === 'cohort') {
		// Loop through cohort resources
		for (const resourceItem of resource.resources || []) {
			const entitlementId = await config.createEntitlement({
				userId: user.id,
				resourceId: resourceItem.resource.id,
				sourceId: purchase.id,
				organizationId,
				organizationMembershipId: orgMembership.id,
				entitlementType: contentAccessEntitlementType.id,
				sourceType: EntitlementSourceType.PURCHASE,
				metadata: {
					contentIds: [resourceItem.resource.id],
				},
			})

			createdEntitlements.push({
				entitlementId,
				resourceId: resourceItem.resource.id,
				resourceType: resourceItem.resource.type,
				resourceTitle: resourceItem.resource.fields?.title,
			})
		}
	} else {
		// Single workshop resource
		const entitlementId = await config.createEntitlement({
			userId: user.id,
			resourceId: resource.id,
			sourceId: purchase.id,
			organizationId,
			organizationMembershipId: orgMembership.id,
			entitlementType: contentAccessEntitlementType.id,
			sourceType: EntitlementSourceType.PURCHASE,
			metadata: {
				contentIds: [resource.id],
			},
		})

		createdEntitlements.push({
			entitlementId,
			resourceId: resource.id,
			resourceType: resource.type,
			resourceTitle: resource.fields?.title,
		})
	}

	return createdEntitlements
}

/**
 * Filter workshops to only those the user does NOT have entitlements for
 *
 * Checks both cohort_content_access and workshop_content_access entitlements.
 * Only considers active (non-expired, non-deleted) entitlements.
 *
 * @param userEntitlements - Array of user entitlements from getAllUserEntitlements()
 * @param workshops - Array of workshop content resources to filter
 * @returns Array of workshops the user does NOT have access to
 *
 * @example
 * ```ts
 * const entitlements = await getAllUserEntitlements(userId)
 * const allWorkshops = await getAllWorkshops()
 * const unpurchased = await filterForUnpurchasedWorkshops(entitlements, allWorkshops)
 * ```
 */
export async function filterForUnpurchasedWorkshops(
	userEntitlements: Array<{
		entitlementType: string
		metadata: Record<string, any> | null
	}>,
	workshops: Array<{ id: string; [key: string]: any }>,
): Promise<Array<{ id: string; [key: string]: any }>> {
	// Get entitlement type IDs for cohort and workshop content access
	const contentAccessTypes = await db.query.entitlementTypes.findMany({
		where: or(
			eq(entitlementTypes.name, PRODUCT_TYPE_CONFIG.cohort.contentAccess),
			eq(
				entitlementTypes.name,
				PRODUCT_TYPE_CONFIG['self-paced'].contentAccess,
			),
		),
	})

	const contentAccessTypeIds = new Set(contentAccessTypes.map((t) => t.id))

	// Filter to only cohort/workshop content access entitlements
	const relevantEntitlements = userEntitlements.filter((entitlement) =>
		contentAccessTypeIds.has(entitlement.entitlementType),
	)

	// Extract all content IDs the user has access to
	const accessibleContentIds = new Set<string>()
	for (const entitlement of relevantEntitlements) {
		const metadata = entitlement.metadata as { contentIds?: string[] } | null
		if (metadata?.contentIds) {
			metadata.contentIds.forEach((id) => accessibleContentIds.add(id))
		}
	}

	// Return only workshops the user does NOT have access to
	return workshops.filter((workshop) => !accessibleContentIds.has(workshop.id))
}
