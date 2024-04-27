import * as React from 'react'

import RedeemDialog from './redeem-dialog'

type CouponValidator = {
	isValid: boolean
	id: string
	isRedeemable: boolean
}

export function useCoupon(
	coupon?: CouponValidator,
	product?: {
		id: string
		image?: {
			url: string
			width: number
			height: number
		}
		title?: string
		description?: string
	},
) {
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
