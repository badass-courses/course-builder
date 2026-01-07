'use client'

import type { Purchase } from '@coursebuilder/core/schemas'

/**
 * Conditionally render content based on user's product ownership
 * Receives already-fetched purchase data from server
 */
export function HasPurchased({
	productSlug,
	productId,
	children,
	purchases,
	productMap,
}: {
	productSlug?: string
	productId?: string
	children: React.ReactNode
	purchases: Purchase[]
	productMap: Map<string, string>
}) {
	let targetProductId = productId

	// If productSlug provided, look up the product ID
	if (productSlug && !targetProductId) {
		targetProductId = productMap.get(productSlug)
	}

	// Check if user has a valid paid purchase for the specified product
	// Note: Includes both 'Valid' and 'Restricted' (PPP) purchases with positive amount
	const hasPurchased = targetProductId
		? purchases.some(
				(purchase) =>
					purchase.productId === targetProductId &&
					(purchase.status === 'Valid' || purchase.status === 'Restricted') &&
					purchase.totalAmount > 0,
			)
		: false

	return hasPurchased ? <>{children}</> : null
}
