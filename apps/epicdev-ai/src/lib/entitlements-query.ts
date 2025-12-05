import { db } from '@/db'
import { entitlements, organizationMemberships } from '@/db/schema'
import {
	PRODUCT_TYPE_CONFIG,
	type ProductType,
} from '@/inngest/config/product-types'
import { EntitlementSourceType } from '@/lib/entitlements'
import { getAllWorkshopsInProduct } from '@/lib/workshops-query'
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
		product?: any
	},
) {
	const {
		user,
		purchase,
		organizationId,
		orgMembership,
		contentAccessEntitlementType,
		product,
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
		// Check if this product has multiple workshops
		let allWorkshops: any[] = []

		if (product?.id) {
			// Get all workshops in the product using any workshop resource from the product
			const firstWorkshopResource = product.resources?.find(
				(r: any) => r.resource?.type === 'workshop',
			)?.resource

			if (firstWorkshopResource) {
				// Use the first workshop to get all workshops in the product
				const workshopSlugOrId =
					firstWorkshopResource.fields?.slug || firstWorkshopResource.id
				allWorkshops = await getAllWorkshopsInProduct(workshopSlugOrId)
			}
		}

		// Fallback: if no product provided, check by resource slug (for backwards compatibility)
		if (allWorkshops.length === 0) {
			const workshopSlug = resource.fields?.slug || resource.id
			if (workshopSlug === 'epic-mcp-from-scratch-to-production') {
				allWorkshops = await getAllWorkshopsInProduct(workshopSlug)
			}
		}

		// If we found multiple workshops, create entitlements for all of them
		if (allWorkshops.length > 1) {
			for (const workshop of allWorkshops) {
				const entitlementId = await config.createEntitlement({
					userId: user.id,
					resourceId: workshop.id,
					sourceId: purchase.id,
					organizationId,
					organizationMembershipId: orgMembership.id,
					entitlementType: contentAccessEntitlementType.id,
					sourceType: EntitlementSourceType.PURCHASE,
					metadata: {
						contentIds: [workshop.id],
					},
				})

				createdEntitlements.push({
					entitlementId,
					resourceId: workshop.id,
					resourceType: workshop.type,
					resourceTitle: workshop.fields?.title,
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
	}

	return createdEntitlements
}
