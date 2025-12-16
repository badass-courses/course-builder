import { courseBuilderAdapter, db } from '@/db'
import { contentResource, contentResourceProduct, products } from '@/db/schema'
import { formatDiscount } from '@/utils/discount-formatter'
import { and, eq, sql } from 'drizzle-orm'

import { getCouponForCode } from '@coursebuilder/core/lib/pricing/props-for-commerce'
import type { Coupon } from '@coursebuilder/core/schemas'
import { getResourcePath } from '@coursebuilder/utils-resource/resource-paths'

const DEBUG_MODE = false

export type SaleBannerData = {
	discountType: 'percentage' | 'fixed'
	discountValue: number
	discountFormatted: string
	percentOff?: number // for backward compatibility with existing code
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
	if (DEBUG_MODE) {
		return {
			discountType: 'percentage',
			discountValue: 10,
			discountFormatted: '10% off',
			productName: 'Node.js Mastery',
			productType: 'self-paced',
			productPath: '/node-js-mastery',
		}
	}
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
			.where(
				and(
					eq(products.id, coupon.restrictedToProductId),
					eq(sql`JSON_EXTRACT (${products.fields}, "$.visibility")`, 'public'),
					eq(sql`JSON_EXTRACT (${products.fields}, "$.state")`, 'published'),
				),
			)
			.limit(1)

		const result = rows[0]
		if (!result?.resource?.fields?.slug) {
			return null
		}

		// Determine discount type and format
		const hasFixedDiscount = coupon.amountDiscount && coupon.amountDiscount > 0
		const discountType = hasFixedDiscount ? 'fixed' : 'percentage'

		let discountValue: number
		let percentOff: number | undefined

		if (hasFixedDiscount && coupon.amountDiscount) {
			// Fixed amount discount (in cents, convert to dollars)
			discountValue = coupon.amountDiscount / 100
		} else {
			// Percentage discount
			percentOff = parseFloat(
				(Number(coupon.percentageDiscount) * 100).toFixed(1),
			)
			discountValue = percentOff
		}

		const discountFormatted = formatDiscount(coupon)

		return {
			discountType,
			discountValue,
			discountFormatted,
			percentOff, // for backward compatibility
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
	console.log('couponCodeOrId', couponCodeOrId)
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

export async function getSaleBannerDataFromSearchParams(searchParams?: {
	code?: string
	coupon?: string
}): Promise<SaleBannerData | null> {
	const coupon = await getActiveCoupon(searchParams)
	return await getSaleBannerData(coupon)
}
