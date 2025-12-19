'use server'

import { db } from '@/db'
import { products } from '@/db/schema'
import { eq } from 'drizzle-orm'

/**
 * Gets a map of product slugs to product IDs for use in HasPurchased components.
 * Server-only function.
 */
export async function getProductSlugToIdMap(): Promise<Map<string, string>> {
	const allProducts = await db.query.products.findMany({
		where: eq(products.status, 1),
	})
	return new Map<string, string>(
		allProducts
			.filter((p): p is typeof p & { fields: { slug: string } } =>
				Boolean(p.fields?.slug),
			)
			.map((p) => [p.fields.slug, p.id]),
	)
}
