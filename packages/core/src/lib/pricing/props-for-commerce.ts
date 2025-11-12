'use server'

import { ParsedUrlQuery } from 'querystring'
import { isBefore } from 'date-fns'
import { Product } from 'src/schemas/product-schema'
import { Purchase } from 'src/schemas/purchase-schema'

import { CourseBuilderAdapter } from '../../adapters'
import { Coupon } from '../../schemas'

export const validateCoupon = async (
	coupon: Coupon | null,
	productIds: string[] = [],
) => {
	if (!coupon) {
		return {
			isValid: false,
			isRedeemable: false,
			error: 'coupon-not-found',
		}
	}

	const isUsedUp =
		coupon.maxUses > 0 ? coupon.usedCount >= coupon.maxUses : false

	const isExpired = coupon.expires
		? isBefore(new Date(coupon.expires), new Date())
		: false

	if (
		coupon.restrictedToProductId &&
		!productIds.includes(coupon.restrictedToProductId)
	) {
		return {
			isValid: false,
			isRedeemable: false,
			error: 'coupon-not-valid-for-product',
		}
	}

	const isValid = !isUsedUp && !isExpired

	return {
		isExpired,
		isUsedUp,
		isRedeemable:
			isValid && Number(coupon.percentageDiscount) >= 1 && !coupon.default,
		isValid,
	}
}

export async function getCouponForCode(
	code: string | null,
	productIds: string[] = [],
	adapter: CourseBuilderAdapter,
) {
	if (!code) return undefined

	let couponFromCode = code && (await adapter.getCoupon(code))

	if (couponFromCode) {
		if (
			productIds.length === 0 &&
			couponFromCode.restrictedToProductId &&
			couponFromCode.percentageDiscount === 1
		) {
			productIds = [couponFromCode?.restrictedToProductId]
		}
		const validatedCoupon = await validateCoupon(couponFromCode, productIds)
		return {
			...couponFromCode,
			...validatedCoupon,
		}
	}

	return undefined
}

export type PropsForCommerce = {
	products: Product[]
	allowPurchase: boolean
	purchases?: Purchase[] | undefined
	couponIdFromCoupon?: string | undefined
	couponFromCode?: any
	userId?: string | undefined
	country?: string
}

export async function propsForCommerce(
	{
		query,
		userId,
		products,
		countryCode = 'US',
	}: {
		query: ParsedUrlQuery
		userId: string | null | undefined
		products: Product[]
		countryCode?: string
	},
	adapter: CourseBuilderAdapter,
): Promise<PropsForCommerce> {
	const productIds = products.map((product) => product.id)

	const couponFromCode = await getCouponForCode(
		(query.code || query.coupon) as string,
		productIds,
		adapter,
	)
	const allowPurchase = true

	const purchases = userId ? await adapter.getPurchasesForUser(userId) : null

	const couponIdFromCoupon =
		(query.coupon as string) || (couponFromCode?.isValid && couponFromCode.id)

	return {
		...(userId ? { userId } : {}),
		...(couponFromCode && {
			couponFromCode: couponFromCode,
		}),
		...(couponIdFromCoupon && { couponIdFromCoupon }),
		purchases: Array.isArray(purchases)
			? purchases.map((purchase) => {
					return {
						...purchase,
						totalAmount:
							// because serializer doesnt handle 0.00
							typeof purchase.totalAmount === 'object'
								? Number(purchase.totalAmount)
								: purchase.totalAmount,
					}
				})
			: [],
		products,
		allowPurchase,
		country: countryCode,
	}
}
