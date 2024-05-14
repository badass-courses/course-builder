'use client'

import * as React from 'react'
import { use } from 'react'

import { Product } from '@coursebuilder/core/schemas'

import RedeemDialog from '../pricing/redeem-dialog'

export const CouponContext = React.createContext<any>({})

export const CouponProvider = ({
	children,
	getProduct,
	getCouponForCode,
}: {
	children: React.ReactNode
	getProduct: (id: string) => Promise<Product | null>
	getCouponForCode: (id: string | null) => Promise<
		| undefined
		| {
				maxUses: number
				bulkCouponPurchases?: any
				expires: Date | null
				code?: string | null | undefined
				isValid: boolean
				merchantCouponId?: string | null | undefined
				createdAt: Date | null
				bulkPurchaseId?: string | null | undefined
				isRedeemable: boolean
				default: boolean
				percentageDiscount: number
				restrictedToProductId?: string | null | undefined
				id: string
				fields: Record<string, any>
				usedCount: number
				status: number
		  }
	>
}) => {
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
