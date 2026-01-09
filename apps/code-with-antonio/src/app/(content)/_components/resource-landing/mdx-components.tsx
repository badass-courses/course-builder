import * as React from 'react'
import {
	DiscountCountdown,
	DiscountDeadline,
	EnrollButton,
	HasDiscount,
	HasPurchased,
	PricingInline,
} from '@/components/pricing'
import type { SaleBannerData } from '@/lib/sale-banner'

import type { Coupon, Product } from '@coursebuilder/core/schemas'
import type { CommerceProps } from '@coursebuilder/core/types'

import type { PricingData } from './pricing/types'

type PricingMdxComponentsProps = {
	product?: Product | null
	hasPurchasedCurrentProduct?: boolean
	pricingDataLoader: Promise<PricingData>
	commerceProps: CommerceProps
	allowPurchase?: boolean
	defaultCoupon: Coupon | null
	saleData: SaleBannerData | null
	productMap: Map<string, string>
}

/**
 * Creates pricing-aware MDX components for resource pages.
 * Provides components like Enroll, HasDiscount, PricingInline, etc.
 * for use in MDX body content across all resource types.
 *
 * @param props - Commerce and pricing data needed for the components
 * @returns MDX component map with pricing-aware components
 */
export function createPricingMdxComponents({
	product,
	hasPurchasedCurrentProduct,
	pricingDataLoader,
	commerceProps,
	allowPurchase,
	defaultCoupon,
	saleData,
	productMap,
}: PricingMdxComponentsProps) {
	const CtaButton = ({
		children = 'Enroll Now',
	}: {
		children?: React.ReactNode
	}) =>
		product && !hasPurchasedCurrentProduct && allowPurchase ? (
			<EnrollButton
				product={product}
				pricingDataLoader={pricingDataLoader}
				{...commerceProps}
			>
				{children}
			</EnrollButton>
		) : null

	return {
		// CTA button - available as both Enroll and RegisterNow for flexibility
		Enroll: CtaButton,
		RegisterNow: CtaButton,
		HasDiscount: ({
			children,
			fallback,
		}: {
			children: React.ReactNode
			fallback?: React.ReactNode
		}) => (
			<HasDiscount
				defaultCoupon={defaultCoupon}
				saleData={saleData}
				fallback={fallback}
			>
				{children}
			</HasDiscount>
		),
		DiscountCountdown: () => {
			return defaultCoupon?.expires ? (
				<DiscountCountdown date={new Date(defaultCoupon.expires)} />
			) : null
		},
		PricingInline: ({ type }: { type: 'original' | 'discounted' }) => (
			<PricingInline type={type} pricingDataLoader={pricingDataLoader} />
		),
		DiscountDeadline: ({ format }: { format?: 'short' | 'long' }) => (
			<DiscountDeadline
				format={format}
				expires={defaultCoupon?.expires ?? null}
			/>
		),
		HasPurchased: ({
			productSlug,
			productId,
			children,
		}: {
			productSlug?: string
			productId?: string
			children: React.ReactNode
		}) => (
			<HasPurchased
				productSlug={productSlug}
				productId={productId}
				purchases={commerceProps.purchases || []}
				productMap={productMap}
			>
				{children}
			</HasPurchased>
		),
	}
}

/**
 * @deprecated Use createPricingMdxComponents instead
 */

/**
 * @deprecated Use createPricingMdxComponents instead
 */
