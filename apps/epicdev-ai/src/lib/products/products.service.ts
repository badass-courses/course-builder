import { db } from '@/db'
import { products, purchases, users } from '@/db/schema'
import { and, count, desc, eq, inArray, sql, StringChunk } from 'drizzle-orm'

/**
 * Fetches all active products with their valid purchase counts for admin dashboard
 * @returns A promise that resolves to an array of products with purchase counts
 */
export async function getProductsWithPurchaseCounts() {
	return db
		.select({
			id: products.id,
			name: products.name,
			type: products.type,
			slug: sql<string>`JSON_UNQUOTE(JSON_EXTRACT(${products.fields}, '$.slug'))`.as(
				'slug',
			),
			quantityAvailable: products.quantityAvailable,
			validPurchaseCount:
				sql<number>`COALESCE(COUNT(CASE WHEN ${purchases.status} = 'Valid' THEN 1 END), 0)`.as(
					'validPurchaseCount',
				),
		})
		.from(products)
		.leftJoin(purchases, eq(products.id, purchases.productId))
		.where(eq(products.status, 1)) // Active products only
		.groupBy(products.id)
		.orderBy(desc(products.createdAt))
}

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
