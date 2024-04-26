import * as React from 'react'
import { PricingData } from '@/lib/pricing-query'
import { CouponForCode } from '@/pricing/coupon-for-code'
import { QueryStatus } from '@tanstack/react-query'

import { Product } from '@coursebuilder/core/schemas'

export type PricingProps = {
	product: Product
	purchased?: boolean
	userId?: string
	index?: number
	couponId?: string
	couponFromCode?: CouponForCode | null
	cancelUrl?: string
	allowPurchase?: boolean
	canViewRegionRestriction?: boolean
	bonuses?: {
		title: string
		slug: string
		description?: string
		image?: string
		expiresAt?: string
	}[]
	purchaseButtonRenderer?: (
		formattedPrice: any,
		product: Product,
		status: QueryStatus,
	) => React.ReactNode
	options?: {
		withImage?: boolean
		withGuaranteeBadge?: boolean
		isLiveEvent?: boolean
		isPPPEnabled?: boolean
		teamQuantityLimit?: number
		saleCountdownRenderer?: ({ coupon }: { coupon: any }) => React.ReactNode
	}
	id?: string
	pricingDataLoader: Promise<PricingData>
}
