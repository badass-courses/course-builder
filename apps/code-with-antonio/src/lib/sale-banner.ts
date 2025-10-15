import { courseBuilderAdapter, db } from '@/db'
import { contentResource, contentResourceProduct, products } from '@/db/schema'
import { eq } from 'drizzle-orm'

import { getCouponForCode } from '@coursebuilder/core/pricing/props-for-commerce'
import type { Coupon } from '@coursebuilder/core/schemas'
import { getResourcePath } from '@coursebuilder/utils-resource/resource-paths'

export type SaleBannerData = {
	percentOff: number
	productName: string
	productType: string | null
	productPath: string
}

/**
 * Gets the active coupon - either from URL params or falls back to default
 * @param searchParams - Next.js search params containing potential coupon codes
 * @returns Promise<Coupon | null> - Active coupon or null
 */
export async function getActiveCoupon(searchParams?: {
	code?: string
	coupon?: string
}): Promise<Coupon | null> {
	const couponCodeOrId = searchParams?.code || searchParams?.coupon

	// Check for URL-based coupon first
	if (couponCodeOrId) {
		const coupon = await getCouponForCode(
			couponCodeOrId,
			[],
			courseBuilderAdapter,
		)
		if (coupon?.isValid) {
			return coupon
		}
	}

	// Fall back to default coupon
	const allProducts = await db.select().from(products)
	const productIds = allProducts.map((p) => p.id)

	if (productIds.length === 0) {
		return null
	}

	const coupons = await courseBuilderAdapter.getDefaultCoupon(productIds)
	return coupons?.defaultCoupon || null
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
