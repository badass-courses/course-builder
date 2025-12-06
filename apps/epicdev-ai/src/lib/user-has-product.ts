import { courseBuilderAdapter } from '@/db'

import type { Purchase } from '@coursebuilder/core/schemas'

/**
 * Filters purchases to only include Valid or Restricted status purchases
 * @param purchases - Array of purchases to filter
 * @returns Array of valid purchases
 */
function getValidPurchases(purchases: Purchase[]): Purchase[] {
	return purchases.filter((purchase: Purchase) =>
		['Valid', 'Restricted'].includes(purchase.status),
	)
}

/**
 * Checks if a user has purchased a specific product
 *
 * Both Valid and Restricted purchases are considered as ownership.
 * Returns false if productId or userId are missing.
 *
 * @param productId - The product ID to check for purchase
 * @param userId - The user ID to check purchases for (optional)
 * @returns Promise<boolean> - True if user has purchased the product, false otherwise
 *
 * @example
 * ```ts
 * const hasPurchased = await hasPurchasedProduct('product-123', 'user-456')
 * if (!hasPurchased) {
 *   // Show sale banner
 * }
 * ```
 */
export async function hasPurchasedProduct(
	productId: string | null | undefined,
	userId: string | null | undefined,
): Promise<boolean> {
	if (!productId || !userId) {
		return false
	}

	const purchases = await courseBuilderAdapter.getPurchasesForUser(userId)
	const validPurchases = getValidPurchases(purchases)

	return validPurchases.some((purchase) => purchase.productId === productId)
}
