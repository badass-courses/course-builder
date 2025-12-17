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

import type { Coupon, Product, Purchase } from '@coursebuilder/core/schemas'
import type { CommerceProps } from '@coursebuilder/core/types'

import type { PricingData } from './pricing/types'

type BaseMdxPricingProps = {
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
 * Creates MDX component map for event pages.
 * Provides pricing-aware components for use in event body content.
 */
export function createEventMdxComponents({
	product,
	hasPurchasedCurrentProduct,
	pricingDataLoader,
	commerceProps,
	allowPurchase,
	defaultCoupon,
	saleData,
	productMap,
}: BaseMdxPricingProps) {
	return {
		Enroll: ({ children = 'Enroll Now' }: { children?: React.ReactNode }) =>
			product && !hasPurchasedCurrentProduct && allowPurchase ? (
				<EnrollButton
					product={product}
					pricingDataLoader={pricingDataLoader}
					{...commerceProps}
				>
					{children}
				</EnrollButton>
			) : null,
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
 * Creates MDX component map for workshop pages.
 * Provides pricing-aware components for use in workshop body content.
 */
export function createWorkshopMdxComponents({
	product,
	hasPurchasedCurrentProduct,
	pricingDataLoader,
	commerceProps,
	allowPurchase,
	defaultCoupon,
	saleData,
	productMap,
}: BaseMdxPricingProps) {
	return {
		Enroll: ({ children = 'Enroll Now' }: { children?: React.ReactNode }) =>
			product && !hasPurchasedCurrentProduct && allowPurchase ? (
				<EnrollButton
					product={product}
					pricingDataLoader={pricingDataLoader}
					{...commerceProps}
				>
					{children}
				</EnrollButton>
			) : null,
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
 * Creates MDX component map for cohort pages.
 * Provides pricing-aware components for use in cohort body content.
 */
export function createCohortMdxComponents({
	product,
	hasPurchasedCurrentProduct,
	pricingDataLoader,
	commerceProps,
	allowPurchase,
	defaultCoupon,
	saleData,
	productMap,
}: BaseMdxPricingProps) {
	return {
		RegisterNow: ({
			children = 'Register Now',
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
			) : null,
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
