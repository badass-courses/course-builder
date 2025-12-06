import { courseBuilderAdapter } from '@/db'
import { getSaleBannerData } from '@/lib/sale-banner'
import type { SaleBannerData } from '@/lib/sale-banner'
import { hasPurchasedProduct } from '@/lib/user-has-product'
import { getServerAuthSession } from '@/server/auth'

import type { Coupon } from '@coursebuilder/core/schemas'

/**
 * Determines if the sale banner should be shown based on commerce settings,
 * coupon availability, and user purchase status
 *
 * @param defaultCoupon - The default coupon data (can be null)
 * @param isCommerceEnabled - Whether commerce is enabled
 * @returns Object containing shouldShowSaleBanner flag and saleBannerData
 *
 * @example
 * ```ts
 * const { shouldShowSaleBanner, saleBannerData } =
 *   await getSaleBannerVisibility(defaultCoupon, isCommerceEnabled)
 *
 * if (shouldShowSaleBanner) {
 *   // Render banner
 * }
 * ```
 */
export async function getSaleBannerVisibility(
	defaultCoupon: Coupon | null,
	isCommerceEnabled: boolean,
): Promise<{
	shouldShowSaleBanner: boolean
	saleBannerData: SaleBannerData | null
}> {
	const saleBannerData = await getSaleBannerData(defaultCoupon)
	const { session } = await getServerAuthSession()

	const userHasPurchased =
		defaultCoupon?.restrictedToProductId && session?.user?.id
			? await hasPurchasedProduct(
					defaultCoupon.restrictedToProductId,
					session.user.id,
				)
			: false

	const shouldShowSaleBanner =
		defaultCoupon && saleBannerData && isCommerceEnabled && !userHasPurchased

	return { shouldShowSaleBanner, saleBannerData }
}
