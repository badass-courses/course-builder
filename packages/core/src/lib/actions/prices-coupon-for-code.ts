import { isBefore } from 'date-fns'

import { Coupon } from '../../schemas'
import { InternalOptions, RequestInternal, ResponseInternal } from '../../types'
import { Cookie } from '../utils/cookie'

const validateCoupon = (coupon: Coupon | null, productIds: string[] = []) => {
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
	request: RequestInternal,
	cookies: Cookie[],
	options: InternalOptions,
): Promise<ResponseInternal> {
	const { code, productIds } = request.body || {}

	if (!code)
		return {
			body: null,
			headers: { 'Content-Type': 'application/json' },
			cookies,
		}

	let couponFromCode = code && (await options.adapter?.getCoupon(code))

	if (couponFromCode) {
		const is100Percent =
			productIds.length === 0 &&
			couponFromCode.restrictedToProductId &&
			couponFromCode.percentageDiscount === 1

		const validatedCoupon = validateCoupon(
			couponFromCode,
			is100Percent ? [couponFromCode?.restrictedToProductId] : productIds,
		)
		return {
			body: {
				...couponFromCode,
				...validatedCoupon,
			},
			headers: { 'Content-Type': 'application/json' },
			cookies,
		}
	}

	return {
		body: null,
		headers: { 'Content-Type': 'application/json' },
		cookies,
	}
}
