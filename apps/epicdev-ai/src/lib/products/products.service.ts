import { db } from '@/db'
import { products, purchases, users } from '@/db/schema'
import { and, eq, inArray, sql, StringChunk } from 'drizzle-orm'

/**
 * Fetches purchase details, including user and product information, for a list of product IDs.
 * Only returns purchases with a 'Valid' status.
 *
 * @param productIds - An array of product IDs to fetch purchase data for.
 * @returns A promise that resolves to an array of purchase details.
 */
export async function getProductPurchaseData({
	productIds,
}: {
	productIds: string[]
}) {
	const purchaseDetails = await db
		.select({
			user_id: users.id,
			email: users.email,
			name: users.name,
			productId: purchases.productId,
			product_name: products.name,
			purchase_date: sql<string>`${purchases.createdAt}`.as('purchase_date'),
		})
		.from(purchases)
		.innerJoin(users, eq(purchases.userId, users.id))
		.innerJoin(products, eq(purchases.productId, products.id))
		.where(
			and(
				inArray(purchases.productId, productIds),
				eq(purchases.status, 'Valid'),
			),
		)

	return purchaseDetails
}
