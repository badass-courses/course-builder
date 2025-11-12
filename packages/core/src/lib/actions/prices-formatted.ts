import { isAfter } from 'date-fns'
import { z } from 'zod'

import { find } from '@coursebuilder/nodash'

import { CourseBuilderAdapter } from '../../adapters'
import { Coupon, Purchase } from '../../schemas'
import { PricingFormattedInputSchema } from '../../schemas/pricing-formatted-input-schema'
import { InternalOptions, RequestInternal, ResponseInternal } from '../../types'
import { formatPricesForProduct } from '../pricing/format-prices-for-product'
import { Cookie } from '../utils/cookie'

const checkForAnyAvailableUpgrades = async ({
	upgradeFromPurchaseId,
	productId,
	purchases,
	courseBuilderAdapter,
}: {
	upgradeFromPurchaseId: string | undefined
	productId: string
	purchases: Array<{ id: string; productId: string; status: string }>
	country: string
	courseBuilderAdapter: CourseBuilderAdapter
}) => {
	if (upgradeFromPurchaseId) return upgradeFromPurchaseId

	const validPurchases = getValidPurchases(purchases)
	const productIdsAlreadyPurchased = validPurchases.map(
		(purchase) => purchase.productId,
	)

	const potentialUpgrades =
		await courseBuilderAdapter.availableUpgradesForProduct(
			validPurchases,
			productId,
		)

	type AvailableUpgrade = Awaited<
		ReturnType<typeof courseBuilderAdapter.availableUpgradesForProduct>
	>[0]
	// filter out potential upgrades that have already been purchased
	const availableUpgrades = potentialUpgrades.filter<AvailableUpgrade>(
		(
			availableUpgrade: AvailableUpgrade,
		): availableUpgrade is AvailableUpgrade => {
			return !productIdsAlreadyPurchased.includes(
				availableUpgrade.upgradableTo.id,
			)
		},
	)

	return find(validPurchases, (purchase) => {
		const upgradeProductIds = availableUpgrades.map(
			(upgrade) => upgrade.upgradableFrom.id,
		)
		return upgradeProductIds.includes(purchase.productId)
	})?.id
}

const getValidPurchases = (purchases: any[]): Purchase[] => {
	return purchases.filter((purchase: Purchase) =>
		['Valid', 'Restricted'].includes(purchase.status),
	)
}

function couponIsValid(coupon?: Coupon | null) {
	if (coupon) {
		const unlimitedUse = coupon.maxUses === -1
		const now = new Date()
		if (!unlimitedUse && coupon.usedCount >= coupon.maxUses) return false
		if (coupon.expires && isAfter(now, coupon.expires)) return false
	} else {
		return false
	}
	return true
}

async function getActiveMerchantCoupon({
	productId,
	siteCouponId,
	code,
	courseBuilderAdapter,
}: {
	productId: string | undefined
	siteCouponId: string | null | undefined
	code: string | undefined
	courseBuilderAdapter: CourseBuilderAdapter
}) {
	let activeMerchantCoupon = null
	let usedCouponId

	const defaultCoupons = productId
		? await courseBuilderAdapter.getDefaultCoupon([productId])
		: undefined

	const defaultMerchantCoupon = defaultCoupons
		? defaultCoupons.defaultMerchantCoupon
		: null

	const incomingCoupon = await courseBuilderAdapter.couponForIdOrCode({
		couponId: siteCouponId,
		code,
	})

	// If a custom coupon code/couponId was explicitly provided, it should ALWAYS override the default
	// This allows admins to give specific people custom coupons that override site-wide defaults
	const hasExplicitCustomCoupon =
		(siteCouponId || code) &&
		incomingCoupon?.merchantCoupon &&
		couponIsValid(incomingCoupon)

	if (hasExplicitCustomCoupon) {
		// Custom coupon provided - always use it, overriding default
		activeMerchantCoupon = incomingCoupon.merchantCoupon
		usedCouponId = incomingCoupon.id
	} else if (defaultMerchantCoupon) {
		activeMerchantCoupon = defaultMerchantCoupon
		usedCouponId = defaultCoupons?.defaultCoupon?.id
	}

	const defaultCoupon = defaultCoupons?.defaultCoupon

	return {
		usedCouponId,
		activeMerchantCoupon,
		...(defaultCoupon &&
			defaultCoupon.merchantCouponId === activeMerchantCoupon?.id && {
				defaultCoupon,
			}),
	}
}

const CheckForAvailableCouponsSchema = PricingFormattedInputSchema.pick({
	merchantCoupon: true,
	couponId: true,
	code: true,
	productId: true,
})
type CheckForAvailableCoupons = z.infer<typeof CheckForAvailableCouponsSchema>

const checkForAvailableCoupons = async ({
	merchantCoupon,
	couponId,
	productId,
	courseBuilderAdapter,
}: CheckForAvailableCoupons & {
	courseBuilderAdapter: CourseBuilderAdapter
}) => {
	// explicit incoming merchant coupons are honored
	// without checking for other potential coupons
	// if there is no explicit incoming merchant coupon
	// we check for default/global coupon or an incoming code
	if (merchantCoupon?.id) {
		return {
			activeMerchantCoupon: merchantCoupon,
			defaultCoupon: undefined,
		}
	} else {
		// getActiveMerchantCoupon now handles the logic:
		// - If custom coupon code/couponId provided, it overrides default
		// - Otherwise, uses default coupon
		// Special credit coupons (entitlement-based) will stack on top via formatPricesForProduct
		const { activeMerchantCoupon, defaultCoupon, usedCouponId } =
			await getActiveMerchantCoupon({
				siteCouponId: couponId,
				productId,
				code: undefined, // Note: code parameter not available in this context, but couponId should work
				courseBuilderAdapter,
			})

		return {
			activeMerchantCoupon,
			defaultCoupon,
			usedCouponId,
		}
	}
}

export async function getPricesFormatted(
	request: RequestInternal,
	cookies: Cookie[],
	options: InternalOptions,
): Promise<ResponseInternal> {
	const currentUser = options.getCurrentUser
		? await options.getCurrentUser()
		: null
	const {
		productId,
		quantity = 1,
		couponId,
		merchantCoupon,
		upgradeFromPurchaseId: _upgradeFromPurchaseId,
		autoApplyPPP,
		userId = currentUser?.id,
	} = PricingFormattedInputSchema.parse(request.body)

	if (!productId) return { status: 400, body: 'productId is required' }

	if (!options.adapter) return { status: 400, body: 'Adapter not found' }

	const purchases = getValidPurchases(
		await options.adapter.getPurchasesForUser(userId),
	)

	const country =
		request.headers?.['x-vercel-ip-country'] ||
		request.body?.country ||
		process.env.DEFAULT_COUNTRY ||
		'US'

	let upgradeFromPurchaseId = await checkForAnyAvailableUpgrades({
		upgradeFromPurchaseId: _upgradeFromPurchaseId,
		productId,
		purchases,
		country,
		courseBuilderAdapter: options.adapter,
	})

	const restrictedPurchase = purchases.find((purchase) => {
		return purchase.productId === productId && purchase.status === 'Restricted'
	})

	if (restrictedPurchase) {
		const validPurchase = purchases.find((purchase) => {
			return purchase.productId === productId && purchase.status === 'Valid'
		})

		if (!validPurchase) {
			upgradeFromPurchaseId = restrictedPurchase.id
		}
	}

	const { activeMerchantCoupon, defaultCoupon, usedCouponId } =
		await checkForAvailableCoupons({
			merchantCoupon,
			couponId,
			productId,
			courseBuilderAdapter: options.adapter,
		})

	const usedCoupon = usedCouponId
		? await options.adapter.getCoupon(usedCouponId)
		: null

	const productPrices = await formatPricesForProduct({
		productId,
		country,
		quantity,
		merchantCouponId: activeMerchantCoupon?.id,
		...(upgradeFromPurchaseId && { upgradeFromPurchaseId }),
		userId,
		autoApplyPPP,
		usedCouponId,
		ctx: options.adapter,
	})

	return {
		body: {
			...productPrices,
			...(defaultCoupon && { defaultCoupon }),
			...(usedCoupon && {
				usedCoupon,
				usedCouponId,
			}),
		},
		headers: {
			'Content-Type': 'application/json',
		},
		cookies,
	}
}
