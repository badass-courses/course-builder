import { CouponForCode } from '@/pricing/coupon-for-code'

import { Product, Purchase } from '@coursebuilder/core/schemas'

export type CommerceProps = {
	couponIdFromCoupon?: string
	couponFromCode?: CouponForCode
	userId?: string
	purchases?: Purchase[]
	products?: Product[]
	allowPurchase?: boolean
}
