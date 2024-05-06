import { Coupon } from '@coursebuilder/core/schemas'

export type CouponForCode = Coupon & {
	isValid: boolean
	isRedeemable: boolean
}
