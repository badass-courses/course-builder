import { isBefore } from 'date-fns'

import { Coupon } from '../../schemas'

export const validateCoupon = (
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
		isRedeemable: isValid && coupon.percentageDiscount >= 1 && !coupon.default,
		isValid,
	}
}
