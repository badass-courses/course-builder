'use client'

import * as React from 'react'
import { ProductPricingFeatures } from '@/components/commerce/product-pricing-features'

import { useCoupon } from '@coursebuilder/commerce-next/coupons/use-coupon'
import * as Pricing from '@coursebuilder/commerce-next/pricing/pricing'
import { Product, Purchase } from '@coursebuilder/core/schemas'
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

export const PricingWidget: React.FC<{
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
}> = ({
	product,
	commerceProps,
	pricingDataLoader,
	pricingWidgetOptions,
	quantityAvailable,
	workshops,
	className,
}) => {
	const couponFromCode = commerceProps?.couponFromCode
	const { validCoupon } = useCoupon(couponFromCode)
	const couponId =
		commerceProps?.couponIdFromCoupon ||
		(validCoupon ? couponFromCode?.id : undefined)

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
					<Pricing.BuyButton className="dark:bg-primary dark:hover:bg-primary/90 from-primary relative mt-3 h-16 max-w-xs cursor-pointer rounded-lg bg-gradient-to-b to-indigo-800 text-lg font-semibold hover:bg-blue-700">
						<span className="relative z-10 dark:text-white">Enroll</span>
						<div
							style={{
								backgroundSize: '200% 100%',
								animationDuration: '2s',
								animationIterationCount: 'infinite',
								animationTimingFunction: 'linear',
								animationFillMode: 'forwards',
								animationDelay: '2s',
							}}
							className="animate-shine absolute inset-0 bg-[linear-gradient(120deg,rgba(255,255,255,0)40%,rgba(255,255,255,1)50%,rgba(255,255,255,0)60%)] opacity-10 dark:opacity-20"
						/>
					</Pricing.BuyButton>
					<Pricing.GuaranteeBadge />
					{/* <Pricing.LiveRefundPolicy /> */}
					<Pricing.SaleCountdown className="mt-3 py-4 [&_p]:text-base [&_p]:font-normal" />
					<Pricing.PPPToggle className="bg-muted mt-5 max-w-sm rounded p-5" />
				</Pricing.Details>
			</Pricing.Product>
			<ProductPricingFeatures workshops={workshops ?? []} />
		</Pricing.Root>
	)
}
