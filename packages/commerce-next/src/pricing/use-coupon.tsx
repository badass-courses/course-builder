import * as React from 'react'

import { Product } from '@coursebuilder/core/schemas'

import RedeemDialog from './redeem-dialog.js'

type CouponValidator = {
	isValid: boolean
	id: string
	isRedeemable: boolean
}

// CouponValidator is from CommerceProps as `couponFromCode`
export function useCoupon(coupon?: CouponValidator, product?: Product) {
	const [validCoupon, setValidCoupon] = React.useState(false)
	React.useEffect(() => {
		setTimeout(() => {
			setValidCoupon(Boolean(coupon && coupon.isValid))
		}, 0)
	}, [coupon])

	return {
		validCoupon,
		redeemableCoupon: validCoupon && coupon?.isRedeemable,
		RedeemDialogForCoupon: () => {
			return coupon ? (
				<RedeemDialog
					product={product}
					open={validCoupon}
					couponId={coupon.id}
				/>
			) : null
		},
	}
}
