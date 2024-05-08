import { Product, Purchase } from '@coursebuilder/core/schemas'

import { CouponForCode } from './coupon-for-code'

export type CommerceProps = {
	couponIdFromCoupon?: string
	couponFromCode?: CouponForCode
	userId?: string
	purchases?: Purchase[]
	products?: Product[]
	allowPurchase?: boolean
}
