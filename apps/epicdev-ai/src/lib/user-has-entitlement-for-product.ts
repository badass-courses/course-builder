import { getAllUserEntitlements } from '@/lib/entitlements-query'

import type { Product } from '@coursebuilder/core/schemas'

/**
 * Checks if a user has entitlements that grant access to a product's resources
 *
 * This function checks both:
 * - Cohort entitlements (cohort_content_access) - checks if any workshop in the product is included
 * - Workshop entitlements (workshop_content_access) - checks if the workshop is included
 *
 * If a user has entitlements that grant access to any resource (workshop) in the product,
 * they are treated as having access, regardless of whether they have a purchase record.
 * This handles cases where entitlements are granted directly via the database.
 *
 * @param userId - The user ID to check entitlements for
 * @param product - The product to check access for
 * @returns Promise<boolean> - True if user has entitlements granting access, false otherwise
 */
export async function userHasEntitlementForProduct(
	userId: string | null | undefined,
	product: Product | null,
): Promise<boolean> {
	if (!userId || !product) {
		return false
	}

	// Get all active entitlements for the user
	const userEntitlements = await getAllUserEntitlements(userId)

	if (userEntitlements.length === 0) {
		return false
	}

	// Collect all resource IDs from the product
	const productResourceIds: string[] = []

	if (product.resources && Array.isArray(product.resources)) {
		product.resources.forEach((resourceItem) => {
			if (resourceItem?.resource?.id) {
				productResourceIds.push(resourceItem.resource.id)
			}
		})
	}

	if (productResourceIds.length === 0) {
		return false
	}

	// Check if any entitlement grants access to any of the product's resources
	for (const entitlement of userEntitlements) {
		const contentIds = entitlement.metadata?.contentIds || []

		if (!Array.isArray(contentIds) || contentIds.length === 0) {
			continue
		}

		// Check if this entitlement grants access to any resource in the product
		const hasAccess = productResourceIds.some((resourceId) =>
			contentIds.includes(resourceId),
		)

		if (hasAccess) {
			return true
		}
	}

	return false
}
