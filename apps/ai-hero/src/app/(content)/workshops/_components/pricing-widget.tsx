'use client'

import {
	ProductPricingFeatures,
	type ProductPricingFeature,
} from '@/components/commerce/product-pricing-features'

import { useCoupon } from '@coursebuilder/commerce-next/coupons/use-coupon'
import * as Pricing from '@coursebuilder/commerce-next/pricing/pricing'
import type { Product, Purchase } from '@coursebuilder/core/schemas'
import type {
	CommerceProps,
	FormattedPrice,
	PricingOptions,
} from '@coursebuilder/core/types'
import { cn } from '@coursebuilder/ui/utils/cn'

export type PricingData = {
	formattedPrice?: FormattedPrice | null
	purchaseToUpgrade?: Purchase | null
	quantityAvailable: number
}

export type PricingWidgetProps = {
	product: Product
	quantityAvailable: number
	commerceProps: CommerceProps
	pricingDataLoader: Promise<PricingData>
	hasPurchasedCurrentProduct?: boolean
	pricingWidgetOptions?: Partial<PricingOptions>
	workshops?: {
		title: string
		slug: string
	}[]
	className?: string
	prependFeatures?: ProductPricingFeature[]
}

/**
 * Pricing widget for product detail surfaces, handling dynamic pricing data,
 * coupon flows, and optional feature overrides.
 *
 * @param props - Pricing configuration.
 */
export const PricingWidget = ({
	product,
	commerceProps,
	pricingDataLoader,
	pricingWidgetOptions,
	quantityAvailable: _quantityAvailable,
	workshops,
	className,
	prependFeatures,
}: PricingWidgetProps) => {
	const couponFromCode = commerceProps?.couponFromCode
	const { validCoupon } = useCoupon(couponFromCode)
	// Priority: couponIdFromCoupon (from ?coupon=) > couponFromCode.id (from ?code=)
	// This ensures custom coupons from URL params always override defaults
	const couponId =
		commerceProps?.couponIdFromCoupon ||
		(validCoupon && couponFromCode?.id ? couponFromCode.id : undefined)

	return (
		<Pricing.Root
			className={cn('relative w-full border-b pb-5', className)}
			product={product}
			couponId={couponId}
			country={commerceProps.country}
			options={pricingWidgetOptions}
			userId={commerceProps?.userId}
			pricingDataLoader={pricingDataLoader}
			{...commerceProps}
		>
			<Pricing.Product className="w-full">
				{/* <Pricing.ProductImage /> */}
				<Pricing.Details className="px-0">
					<Pricing.Name className="text-foreground mb-0 font-normal sm:text-xl" />
					<Pricing.LiveQuantity />
					<Pricing.Price className="**:aria-[live='polite']:text-5xl [&_sup]:-mt-1" />
					<Pricing.TeamToggle className='[&_button>span[data-state="checked"]]:bg-primary mt-0' />
					<Pricing.TeamQuantityInput />
					<Pricing.BuyButton className="dark:bg-primary relative mt-3 h-16 max-w-xs cursor-pointer overflow-hidden rounded-xl bg-blue-600 text-lg font-semibold shadow-xl hover:bg-blue-700 dark:hover:brightness-110">
						<span className="relative z-10">
							{product.type === 'cohort' ? 'Enroll' : 'Buy Now'}
						</span>
						<div
							style={{
								backgroundSize: '200% 100%',
							}}
							className="animate-shine absolute inset-0 bg-[linear-gradient(120deg,rgba(255,255,255,0)40%,rgba(255,255,255,1)50%,rgba(255,255,255,0)60%)] opacity-10 dark:opacity-20"
						/>
					</Pricing.BuyButton>
					<Pricing.GuaranteeBadge />
					{/* <Pricing.LiveRefundPolicy /> */}
					<Pricing.SaleCountdown className="mt-3 py-4 [&_p]:text-base [&_p]:font-normal" />
					<Pricing.PPPToggle className="bg-muted [&_button[data-state='unchecked']]:border-foreground/20 mt-5 max-w-sm rounded p-5 [&_label]:rounded-lg" />
				</Pricing.Details>
			</Pricing.Product>
			<ProductPricingFeatures
				workshops={workshops ?? []}
				productType={product.type}
				prependFeatures={prependFeatures}
			/>
		</Pricing.Root>
	)
}
