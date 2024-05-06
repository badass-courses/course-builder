'use client'

import * as React from 'react'
import { use } from 'react'
import { getProduct } from '@/lib/products-query'
import { getCouponForCode } from '@/lib/props-for-commerce'

import { Product } from '@coursebuilder/core/schemas'

import RedeemDialog from './redeem-dialog.js'

export const CouponContext = React.createContext<any>({})

export const CouponProvider = ({ children }: { children: React.ReactNode }) => {
	const [couponLoader, setCouponLoader] =
		React.useState<ReturnType<typeof getCouponForCode>>()
	const [productLoader, setProductLoader] = React.useState<
		Promise<Product | null> | undefined
	>()

	React.useEffect(() => {
		const searchParams = new URLSearchParams(window.location.search)

		const codeParam = searchParams.get('code')
		const couponParam = searchParams.get('coupon')

		setCouponLoader(getCouponForCode(codeParam || couponParam))
	}, [])

	const coupon = couponLoader ? use(couponLoader) : undefined
	const validCoupon = Boolean(coupon && coupon.isValid)

	React.useEffect(() => {
		if (coupon?.isValid) {
			setProductLoader(getProduct(coupon.restrictedToProductId as string))
		}
	}, [coupon?.restrictedToProductId, coupon?.isValid])

	const product = productLoader ? use(productLoader) : undefined
	const isRedeemable = validCoupon && product && coupon?.isRedeemable

	console.log({ coupon, product })

	return (
		<CouponContext.Provider value={{ coupon }}>
			<>
				{isRedeemable && (
					<RedeemDialog
						open={validCoupon}
						couponId={coupon?.id}
						product={product}
					/>
				)}
				{children}
			</>
		</CouponContext.Provider>
	)
}
