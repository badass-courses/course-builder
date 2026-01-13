'use client'

import * as React from 'react'
import { ProductPricingFeatures } from '@/components/commerce/product-pricing-features'

import { useCoupon } from '@coursebuilder/commerce-next/coupons/use-coupon'
import * as Pricing from '@coursebuilder/commerce-next/pricing/pricing'
import type { Product } from '@coursebuilder/core/schemas'
import type { CommerceProps } from '@coursebuilder/core/types'
import { cn } from '@coursebuilder/ui/utils/cn'

import type { PricingData, PricingWidgetOptions } from './types'

/**
 * Visual variant for the pricing widget.
 */
export type PricingWidgetVariant = 'full' | 'compact' | 'inline' | 'button-only'

export interface PricingWidgetProps {
	product: Product
	commerceProps: CommerceProps
	pricingDataLoader: Promise<PricingData>
	quantityAvailable: number
	hasPurchasedCurrentProduct?: boolean

	/** Visual variant - determines which elements are shown */
	variant?: PricingWidgetVariant

	/** Feature flags and display options */
	options?: PricingWidgetOptions

	/** Custom CTA button text */
	ctaLabel?: string

	/** Workshops to show in features list */
	workshops?: { title: string; slug: string }[]

	/** Additional CSS classes */
	className?: string
}

/**
 * Unified pricing widget for all product types.
 *
 * Consolidates pricing components from:
 * - commerce/products/.../pricing-widget.tsx
 * - workshops/_components/pricing-widget.tsx
 * - components/commerce/home-pricing-widget.tsx
 * - events/.../inline-event-pricing.tsx
 *
 * Supports multiple visual variants:
 * - full: Complete pricing with all options
 * - compact: Minimal pricing for sidebars
 * - inline: For embedding in content
 * - button-only: Just the buy button with price
 */
export function PricingWidget({
	product,
	commerceProps,
	pricingDataLoader,
	quantityAvailable,
	hasPurchasedCurrentProduct,
	variant = 'full',
	options = {},
	ctaLabel,
	workshops = [],
	className,
}: PricingWidgetProps) {
	const couponFromCode = commerceProps?.couponFromCode
	const { validCoupon } = useCoupon(couponFromCode)
	const couponId =
		commerceProps?.couponIdFromCoupon ||
		(validCoupon ? couponFromCode?.id : undefined)

	const {
		withTitle = true,
		withImage = false,
		withGuaranteeBadge = true,
		isLiveEvent = false,
		isCohort = false,
		isPPPEnabled = true,
		allowTeamPurchase = true,
		teamQuantityLimit = 100,
		cancelUrl = '',
	} = options

	// Determine CTA label based on product type
	const defaultCtaLabel = isCohort
		? 'Enroll'
		: isLiveEvent
			? 'Reserve Your Spot'
			: 'Buy Now'
	const buttonLabel = ctaLabel ?? defaultCtaLabel

	// Variant-specific rendering
	if (variant === 'button-only') {
		return (
			<Pricing.Root
				className={cn('relative w-full', className)}
				product={product}
				couponId={couponId}
				country={commerceProps.country}
				options={options}
				userId={commerceProps?.userId}
				pricingDataLoader={pricingDataLoader}
				{...commerceProps}
			>
				<Pricing.Product className="w-full">
					<Pricing.Details className="px-0">
						<Pricing.Price />
						<Pricing.BuyButton className="dark:bg-primary dark:hover:bg-primary/90 relative mt-3 h-14 w-full bg-blue-600 text-lg font-semibold hover:bg-blue-700">
							{buttonLabel}
						</Pricing.BuyButton>
					</Pricing.Details>
				</Pricing.Product>
			</Pricing.Root>
		)
	}

	if (variant === 'compact') {
		return (
			<Pricing.Root
				className={cn('relative w-full', className)}
				product={product}
				couponId={couponId}
				country={commerceProps.country}
				options={options}
				userId={commerceProps?.userId}
				pricingDataLoader={pricingDataLoader}
				{...commerceProps}
			>
				<Pricing.Product className="w-full">
					<Pricing.Details className="px-0">
						{withTitle && (
							<Pricing.Name className="text-foreground mb-0 font-normal sm:text-xl" />
						)}
						<Pricing.LiveQuantity />
						<Pricing.Price className="**:aria-[live='polite']:text-4xl" />
						<Pricing.BuyButton className="dark:bg-primary dark:hover:bg-primary/90 relative mt-3 h-14 w-full bg-blue-600 text-lg font-semibold hover:bg-blue-700">
							{buttonLabel}
						</Pricing.BuyButton>
						{withGuaranteeBadge && <Pricing.GuaranteeBadge />}
					</Pricing.Details>
				</Pricing.Product>
			</Pricing.Root>
		)
	}

	if (variant === 'inline') {
		return (
			<Pricing.Root
				className={cn(
					'relative flex w-full items-center justify-center border-t pt-8',
					className,
				)}
				product={product}
				couponId={couponId}
				country={commerceProps.country}
				options={options}
				userId={commerceProps?.userId}
				pricingDataLoader={pricingDataLoader}
				{...commerceProps}
			>
				<Pricing.Product className="w-full">
					<Pricing.Details className="px-0">
						<div className="flex flex-wrap items-center justify-between gap-5">
							<Pricing.Price />
							<Pricing.BuyButton className="from-primary bg-linear-to-bl text-white! relative w-auto min-w-[170px] origin-bottom rounded-md to-indigo-800 px-5 py-4 text-base font-semibold shadow-lg shadow-indigo-800/30 transition ease-in-out hover:hue-rotate-[8deg]">
								{buttonLabel}
							</Pricing.BuyButton>
						</div>
						{allowTeamPurchase && (
							<Pricing.TeamQuantityInput className="mb-0 mt-2 w-auto px-0 xl:px-0" />
						)}
						<Pricing.LiveQuantity className="text-foreground mt-2 inline-flex w-auto text-balance bg-transparent px-0 py-0 text-left text-sm capitalize opacity-100" />
						{!isLiveEvent && (
							<Pricing.LiveRefundPolicy className="inline-flex max-w-none pt-0 text-left" />
						)}
					</Pricing.Details>
				</Pricing.Product>
			</Pricing.Root>
		)
	}

	// Default: full variant
	return (
		<Pricing.Root
			className={cn('relative w-full border-b pb-5', className)}
			product={product}
			couponId={couponId}
			country={commerceProps.country}
			options={options}
			userId={commerceProps?.userId}
			pricingDataLoader={pricingDataLoader}
			{...commerceProps}
		>
			<Pricing.Product className="w-full">
				{withImage && <Pricing.ProductImage />}
				<Pricing.Details className="px-0 pt-0">
					{withTitle && (
						<Pricing.Name className="text-foreground mb-0 font-normal sm:text-xl" />
					)}
					<Pricing.LiveQuantity />
					<Pricing.Price className="**:aria-[live='polite']:text-5xl [&_[data-save-percent]]:text-amber-600 [&_[data-save-percent]]:dark:text-yellow-300 [&_sup]:-mt-1" />
					{allowTeamPurchase && (
						<>
							<Pricing.TeamToggle className='[&_button>span[data-state="checked"]]:bg-primary mt-0' />
							<Pricing.TeamQuantityInput />
						</>
					)}
					<Pricing.BuyButton
						data-sr-button="default"
						className="my-3 overflow-hidden rounded-sm"
					>
						<span className="relative z-10">{buttonLabel}</span>
						<div
							style={{ backgroundSize: '200% 100%' }}
							className="animate-shine absolute inset-0 bg-[linear-gradient(120deg,rgba(255,255,255,0)40%,rgba(255,255,255,1)50%,rgba(255,255,255,0)60%)] opacity-10 dark:opacity-20"
						/>
					</Pricing.BuyButton>
					{withGuaranteeBadge && <Pricing.GuaranteeBadge />}
					{isLiveEvent && <Pricing.LiveRefundPolicy />}
					<Pricing.SaleCountdown className="mt-3 py-4 [&_p]:text-base [&_p]:font-normal" />
					{isPPPEnabled && (
						<Pricing.PPPToggle className="bg-muted [&_button[data-state='unchecked']]:border-foreground/20 mt-5 max-w-sm rounded p-5 [&_label]:rounded-lg" />
					)}
				</Pricing.Details>
			</Pricing.Product>
			{workshops.length > 0 && (
				<ProductPricingFeatures
					workshops={workshops}
					productType={product.type}
				/>
			)}
		</Pricing.Root>
	)
}
