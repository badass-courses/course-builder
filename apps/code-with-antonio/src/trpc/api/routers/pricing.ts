import { headers } from 'next/headers'
import { courseBuilderAdapter, db } from '@/db'
import { getServerAuthSession } from '@/server/auth'
import { createTRPCRouter, publicProcedure } from '@/trpc/api/trpc'
import { isAfter } from 'date-fns'
import { z } from 'zod'

import { formatPricesForProduct } from '@coursebuilder/core'
import { propsForCommerce } from '@coursebuilder/core/pricing/props-for-commerce'
import {
	Coupon,
	Product,
	productSchema,
	Purchase,
} from '@coursebuilder/core/schemas'
import { find } from '@coursebuilder/nodash'

const merchantCouponSchema = z.object({
	id: z.string(),
	type: z.string().nullable().optional(),
})

const PricingFormattedInputSchema = z.object({
	productId: z.string().optional(),
	quantity: z.number(),
	couponId: z.string().optional(),
	merchantCoupon: merchantCouponSchema.optional().nullable(),
	upgradeFromPurchaseId: z.string().optional(),
	autoApplyPPP: z.boolean().default(true),
	code: z.string().optional(),
})

export const getValidPurchases = (purchases: any[]): Purchase[] => {
	return purchases.filter((purchase: Purchase) =>
		['Valid', 'Restricted'].includes(purchase.status),
	)
}

const checkForAnyAvailableUpgrades = async ({
	upgradeFromPurchaseId,
	productId,
	purchases,
}: {
	upgradeFromPurchaseId: string | undefined
	productId: string
	purchases: Array<{ id: string; productId: string; status: string }>
	country: string
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

const CheckForAvailableCouponsSchema = PricingFormattedInputSchema.pick({
	merchantCoupon: true,
	couponId: true,
	code: true,
	productId: true,
})
type CheckForAvailableCoupons = z.infer<typeof CheckForAvailableCouponsSchema>

/**
 * @deprecated prefer `validateCoupon`
 * @param coupon
 */
export function couponIsValid(coupon?: Coupon | null) {
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
}: {
	productId: string | undefined
	siteCouponId: string | undefined
	code: string | undefined
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

	if (
		// compare the discounts if there is a coupon and site/sale running
		incomingCoupon?.merchantCoupon &&
		couponIsValid(incomingCoupon) &&
		defaultMerchantCoupon
	) {
		// use whichever coupon provides the bigger discount
		// this application only supports percentage discounts
		// so we only need to check the percentage discount
		const { merchantCoupon: incomingMerchantCoupon } = incomingCoupon
		if (
			incomingMerchantCoupon?.percentageDiscount &&
			incomingMerchantCoupon.percentageDiscount >=
				defaultMerchantCoupon.percentageDiscount
		) {
			activeMerchantCoupon = incomingMerchantCoupon
			usedCouponId = incomingCoupon.id
		} else {
			activeMerchantCoupon = defaultMerchantCoupon
			usedCouponId = defaultCoupons?.defaultCoupon?.id
		}
	} else if (
		// if it's a coupon, use it
		incomingCoupon?.merchantCoupon &&
		couponIsValid(incomingCoupon)
	) {
		activeMerchantCoupon = incomingCoupon.merchantCoupon
		usedCouponId = incomingCoupon.id
	} else if (
		// if a sale is running, use that
		defaultMerchantCoupon
	) {
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

const checkForAvailableCoupons = async ({
	merchantCoupon,
	couponId,
	productId,
}: CheckForAvailableCoupons) => {
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
		const { activeMerchantCoupon, defaultCoupon, usedCouponId } =
			await getActiveMerchantCoupon({
				siteCouponId: couponId,
				productId,
				code: undefined,
			})

		const minimalDefaultCoupon = defaultCoupon && {
			expires: defaultCoupon.expires?.toISOString(),
			percentageDiscount: defaultCoupon.percentageDiscount.toString(),
		}

		return {
			activeMerchantCoupon,
			defaultCoupon,
			usedCouponId,
		}
	}
}

export const pricingRouter = createTRPCRouter({
	propsForCommerce: publicProcedure
		.input(
			z.object({
				code: z.string().optional(),
				coupon: z.string().optional(),
				allowPurchase: z.string().optional(),
				productId: z.string().optional(),
			}),
		)
		.query(async ({ ctx, input }) => {
			const token = await getServerAuthSession()

			const products = await db.query.products.findMany()

			const inputProduct = input.productId
				? await db.query.products.findFirst({
						where: (products, { eq }) =>
							eq(products.id, input.productId as string),
					})
				: undefined

			const countryCode =
				(await headers()).get('x-vercel-ip-country') ||
				process.env.DEFAULT_COUNTRY ||
				'US'
			const props = await propsForCommerce(
				{
					query: input,
					userId: token?.session?.user?.id,
					products: z
						.array(productSchema)
						.parse(inputProduct ? [inputProduct] : products),
					countryCode,
				},
				courseBuilderAdapter,
			)
			return props
		}),
	formatted: publicProcedure
		.input(PricingFormattedInputSchema)
		.query(async ({ ctx, input }) => {
			const {
				productId,
				quantity,
				couponId,
				merchantCoupon,
				upgradeFromPurchaseId: _upgradeFromPurchaseId,
				autoApplyPPP,
			} = input

			const token = await getServerAuthSession()

			const verifiedUserId = token?.session?.user?.id

			const purchases = getValidPurchases(
				await courseBuilderAdapter.getPurchasesForUser(verifiedUserId),
			)

			if (!productId) throw new Error('productId is required')

			const country =
				(await headers()).get('x-vercel-ip-country') ||
				process.env.DEFAULT_COUNTRY ||
				'US'

			let upgradeFromPurchaseId = await checkForAnyAvailableUpgrades({
				upgradeFromPurchaseId: _upgradeFromPurchaseId,
				productId,
				purchases,
				country,
			})

			const restrictedPurchase = purchases.find((purchase) => {
				return (
					purchase.productId === productId && purchase.status === 'Restricted'
				)
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
				})

			const productPrices = await formatPricesForProduct({
				productId,
				country,
				quantity,
				merchantCouponId: activeMerchantCoupon?.id,
				...(upgradeFromPurchaseId && { upgradeFromPurchaseId }),
				userId: verifiedUserId,
				autoApplyPPP,
				usedCouponId,
				ctx: courseBuilderAdapter,
			})

			return {
				...productPrices,
				...(defaultCoupon && { defaultCoupon }),
			}
		}),
	defaultCoupon: publicProcedure.query(async ({ ctx }) => {
		const token = await getServerAuthSession()
		const verifiedUserId = token?.session?.user?.id

		let purchases: Purchase[] = []

		if (verifiedUserId) {
			purchases = getValidPurchases(
				await courseBuilderAdapter.getPurchasesForUser(verifiedUserId),
			)
		}
		const products = await db.query.products.findMany()

		if (!products) return null

		const productIds = products.map((product) => product.id)

		const defaultCoupons =
			productIds.length > 0 &&
			(await courseBuilderAdapter.getDefaultCoupon(productIds))

		const defaultCoupon = defaultCoupons && defaultCoupons?.defaultCoupon

		const hasPurchasedProductFromDefaultCoupon =
			defaultCoupon &&
			purchases.some((purchase) => {
				return purchase.productId === defaultCoupon.restrictedToProductId
			})

		if (!hasPurchasedProductFromDefaultCoupon && defaultCoupon) {
			const product = products.find((product) => {
				return product.id === defaultCoupon.restrictedToProductId
			})
			return { ...defaultCoupon, product }
		}

		return null
	}),
})
