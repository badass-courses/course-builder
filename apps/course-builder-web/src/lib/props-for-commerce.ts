'use server'

import { ParsedUrlQuery } from 'querystring'
import { courseBuilderAdapter } from '@/db'
import { isBefore } from 'date-fns'

import { Coupon, Product } from '@coursebuilder/core/schemas'

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
	code: string,
	productIds: string[] = [],
) {
	const { getCoupon } = courseBuilderAdapter

	let couponFromCode = code && (await getCoupon(code))

	if (couponFromCode) {
		const validatedCoupon = await validateCoupon(couponFromCode, productIds)
		return {
			...couponFromCode,
			...validatedCoupon,
		}
	}
}

export async function propsForCommerce({
	query,
	userId,
	products,
}: {
	query: ParsedUrlQuery
	userId: string | null | undefined
	products: Product[]
}) {
	const productIds = products.map((product) => product.id)

	const couponFromCode = await getCouponForCode(
		query.code as string,
		productIds,
	)
	const allowPurchase = true

	const { getPurchasesForUser } = courseBuilderAdapter

	const purchases = userId ? await getPurchasesForUser(userId) : false

	const couponIdFromCoupon =
		(query.coupon as string) || (couponFromCode?.isValid && couponFromCode.id)

	return {
		...(userId ? { userId } : {}),
		...(couponFromCode && {
			couponFromCode: couponFromCode,
		}),
		...(couponIdFromCoupon && { couponIdFromCoupon }),
		...(purchases && {
			purchases: [
				...purchases.map((purchase) => {
					return {
						...purchase,
						totalAmount:
							// because serializer doesnt handle 0.00
							typeof purchase.totalAmount === 'object'
								? Number(purchase.totalAmount)
								: purchase.totalAmount,
					}
				}),
			],
		}),
		products,
		allowPurchase,
	}
}
