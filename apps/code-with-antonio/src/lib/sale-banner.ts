import { db } from '@/db'
import { contentResource, contentResourceProduct, products } from '@/db/schema'
import { eq } from 'drizzle-orm'

import type { Coupon } from '@coursebuilder/core/schemas'
import { getResourcePath } from '@coursebuilder/utils-resource/resource-paths'

export type SaleBannerData = {
	percentOff: number
	productName: string
	productType: string | null
	productPath: string
}

/**
 * Fetches sale banner data for a given coupon
 * @param coupon - The coupon object containing discount and product restrictions
 * @returns Promise<SaleBannerData | null> - Sale banner data or null if not available
 */
export async function getSaleBannerData(
	coupon: Coupon | null,
): Promise<SaleBannerData | null> {
	if (!coupon?.restrictedToProductId) {
		return null
	}

	try {
		const rows = await db
			.select({
				product: products,
				resource: contentResource,
			})
			.from(products)
			.innerJoin(
				contentResourceProduct,
				eq(contentResourceProduct.productId, products.id),
			)
			.innerJoin(
				contentResource,
				eq(contentResource.id, contentResourceProduct.resourceId),
			)
			.where(eq(products.id, coupon.restrictedToProductId))
			.limit(1)

		const result = rows[0]
		if (!result?.resource?.fields?.slug) {
			return null
		}

		const percentOff = parseFloat(
			(Number(coupon.percentageDiscount) * 100).toFixed(1),
		)

		return {
			percentOff,
			productName: result.product.name,
			productType: result.product.type,
			productPath: getResourcePath(
				result.resource.type,
				result.resource.fields.slug,
				'view',
			),
		}
	} catch (error) {
		console.error('Failed to fetch sale banner data:', error)
		return null
	}
}
