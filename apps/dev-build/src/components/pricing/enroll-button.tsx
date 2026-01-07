'use client'

import * as React from 'react'

import { useCoupon } from '@coursebuilder/commerce-next/coupons/use-coupon'
import * as Pricing from '@coursebuilder/commerce-next/pricing/pricing'
import type { Product, Purchase } from '@coursebuilder/core/schemas'
import type { CommerceProps, PricingData } from '@coursebuilder/core/types'

export type EnrollButtonProps = {
	product: Product
	pricingDataLoader: Promise<PricingData>
	children?: React.ReactNode
} & CommerceProps

/**
 * Client-side Enroll button component for MDX content
 * Handles the interactive pricing/checkout flow
 */
export function EnrollButton({
	product,
	pricingDataLoader,
	children = 'Enroll Now',
	...commerceProps
}: EnrollButtonProps) {
	const couponFromCode = commerceProps?.couponFromCode
	const { validCoupon } = useCoupon(couponFromCode)
	const couponId =
		commerceProps?.couponIdFromCoupon ||
		(validCoupon ? couponFromCode?.id : undefined)

	return (
		<Pricing.Root
			product={product}
			couponId={couponId}
			country={commerceProps.country}
			options={{
				withTitle: false,
				withImage: false,
			}}
			userId={commerceProps?.userId}
			pricingDataLoader={pricingDataLoader}
			className="mt-5 items-start justify-start"
			{...commerceProps}
		>
			<Pricing.Product>
				<Pricing.BuyButton className="dark:bg-primary font-heading dark:hover:bg-primary/90 from-primary relative mt-3 h-12 w-full max-w-sm cursor-pointer overflow-hidden rounded-lg bg-gradient-to-b to-indigo-800 text-base font-semibold tracking-tight shadow-xl transition duration-300 ease-out hover:bg-blue-700 hover:brightness-110">
					<span className="relative z-10 drop-shadow-md dark:text-white">
						{children}
					</span>
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
			</Pricing.Product>
		</Pricing.Root>
	)
}
