import { db } from '@/db'
import { products, purchases, users } from '@/db/schema'
import { and, count, eq, inArray, sql, StringChunk } from 'drizzle-orm'

/**
 * Fetches paginated purchase details, including user and product information, for a list of product IDs.
 * Only returns purchases with a 'Valid' status.
 *
 * @param productIds - An array of product IDs to fetch purchase data for.
 * @param limit - The maximum number of records to return.
 * @param offset - The number of records to skip.
 * @returns A promise that resolves to an object containing the paginated data and the total count.
 */
export async function getProductPurchaseData({
	productIds,
	limit = 50,
	offset = 0,
}: {
	productIds: string[]
	limit?: number
	offset?: number
}) {
	const whereClause = and(
		inArray(purchases.productId, productIds),
		eq(purchases.status, 'Valid'),
	)

	const purchaseDetailsQuery = db
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
		.where(whereClause)
		.limit(limit)
		.offset(offset)
		.orderBy(purchases.createdAt) // Ensure consistent ordering for pagination

	const totalCountQuery = db
		.select({ count: count() })
		.from(purchases)
		.where(whereClause)

	const [data, totalResult] = await Promise.all([
		purchaseDetailsQuery,
		totalCountQuery,
	])

	const totalCount = totalResult[0]?.count || 0

	return { data, totalCount }
}
