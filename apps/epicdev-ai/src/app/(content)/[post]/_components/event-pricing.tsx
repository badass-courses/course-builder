'use client'

import React from 'react'
import Link from 'next/link'
import Spinner from '@/components/spinner'
import { env } from '@/env.mjs'
import type { Post, ProductForPostProps } from '@/lib/posts'
import { Shield } from 'lucide-react'

import { useCoupon } from '@coursebuilder/commerce-next/coupons/use-coupon'
import * as Pricing from '@coursebuilder/commerce-next/pricing/pricing'
import { PriceCheckProvider } from '@coursebuilder/commerce-next/pricing/pricing-check-context'
import { usePricing } from '@coursebuilder/commerce-next/pricing/pricing-context'
import { Product, Purchase } from '@coursebuilder/core/schemas'
import type {
	CommerceProps,
	FormattedPrice,
	PricingOptions,
} from '@coursebuilder/core/types'
// import { PricingWidget } from '@/app/(commerce)/products/[slug]/_components/pricing-widget'
import { formatUsd } from '@coursebuilder/core/utils/format-usd'

export type PricingData = {
	formattedPrice?: FormattedPrice | null
	purchaseToUpgrade?: Purchase | null
	quantityAvailable: number
}

export type PricingComponentProps = {
	product: Product
	quantityAvailable: number
	commerceProps: CommerceProps
	pricingDataLoader: Promise<PricingData>
	hasPurchasedCurrentProduct?: boolean
	pricingWidgetOptions?: Partial<PricingOptions>
}

/**
 * Full pricing widget with price, quantity, and buy button
 */
export const FullPricingWidget: React.FC<PricingComponentProps> = ({
	product,
	commerceProps,
	pricingDataLoader,
	pricingWidgetOptions,
	quantityAvailable,
}) => {
	const couponFromCode = commerceProps?.couponFromCode
	const { validCoupon } = useCoupon(couponFromCode)
	const couponId =
		commerceProps?.couponIdFromCoupon ||
		(validCoupon ? couponFromCode?.id : undefined)

	return (
		<Pricing.Root
			className="relative w-full"
			product={product}
			couponId={couponId}
			options={pricingWidgetOptions}
			userId={commerceProps?.userId}
			pricingDataLoader={pricingDataLoader}
		>
			<Pricing.Product className="w-full">
				{/* <Pricing.ProductImage /> */}
				{/* <Pricing.Name className="" /> */}
				<Pricing.Details className="flex w-full flex-row items-center justify-between pt-0">
					<div className="flex flex-col items-center gap-1">
						<Pricing.Price className="scale-[0.7] text-base" />
						<Pricing.LiveQuantity className="leading-0 -mt-5 flex items-center bg-transparent" />
						<Pricing.SaleCountdown className="py-4" />
					</div>
					{pricingWidgetOptions?.allowTeamPurchase && (
						<>
							<Pricing.TeamToggle />
							<Pricing.TeamQuantityInput />
						</>
					)}
					<div className="">
						<Pricing.BuyButton className="from-primary relative mt-4 w-auto origin-bottom rounded-md bg-gradient-to-bl to-indigo-800 px-10 py-6 text-lg font-medium !text-white shadow-lg shadow-indigo-800/30 transition ease-in-out hover:hue-rotate-[8deg]">
							Buy Ticket
						</Pricing.BuyButton>
						<Pricing.LiveRefundPolicy />
						<Pricing.PPPToggle />
					</div>
				</Pricing.Details>
			</Pricing.Product>
		</Pricing.Root>
	)
}

/**
 * Buy ticket button only
 */
export const BuyTicketButton: React.FC<PricingComponentProps> = ({
	product,
	commerceProps,
	pricingDataLoader,
	pricingWidgetOptions,
	hasPurchasedCurrentProduct,
}) => {
	const couponFromCode = commerceProps?.couponFromCode
	const { validCoupon } = useCoupon(couponFromCode)
	const couponId =
		commerceProps?.couponIdFromCoupon ||
		(validCoupon ? couponFromCode?.id : undefined)

	return hasPurchasedCurrentProduct ? (
		<div>
			Ticket Purchased. We'll send all necessary information to your email
			address. <Link href="/invoices">Invoice</Link>
		</div>
	) : (
		<Pricing.Root
			className="items-start justify-start"
			product={product}
			couponId={couponId}
			options={pricingWidgetOptions}
			userId={commerceProps?.userId}
			pricingDataLoader={pricingDataLoader}
		>
			<Pricing.Product>
				<BuyButton />
				<Pricing.LiveRefundPolicy className="mt-2 w-full max-w-none text-left" />
			</Pricing.Product>
		</Pricing.Root>
	)
}

const BuyButton = () => {
	const { formattedPrice, status } = usePricing()

	return (
		<Pricing.BuyButton className="from-primary relative mt-4 w-auto min-w-[240px] origin-bottom rounded-md bg-gradient-to-bl to-indigo-800 px-10 py-6 text-lg font-medium !text-white shadow-lg shadow-indigo-800/30 transition ease-in-out hover:hue-rotate-[8deg]">
			Buy Ticket —{' '}
			{status === 'pending' ? (
				<Spinner className="ml-1 w-5" />
			) : (
				formattedPrice?.calculatedPrice &&
				formatUsd(formattedPrice?.calculatedPrice).dollars
			)}
		</Pricing.BuyButton>
	)
}

/**
 * Inline pricing display with price and buy button
 */
export const InlinePricingWidget: React.FC<PricingComponentProps> = ({
	product,
	commerceProps,
	pricingDataLoader,
	pricingWidgetOptions,
	hasPurchasedCurrentProduct,
}) => {
	const couponFromCode = commerceProps?.couponFromCode
	const { validCoupon } = useCoupon(couponFromCode)
	const couponId =
		commerceProps?.couponIdFromCoupon ||
		(validCoupon ? couponFromCode?.id : undefined)

	return hasPurchasedCurrentProduct ? (
		<div>
			Ticket Purchased. We'll send all necessary information to your email
			address. <Link href="/invoices">Invoice</Link>
		</div>
	) : (
		<Pricing.Root
			className="relative inline-flex items-center gap-4"
			product={product}
			couponId={couponId}
			options={pricingWidgetOptions}
			userId={commerceProps?.userId}
			pricingDataLoader={pricingDataLoader}
		>
			<Pricing.Product>
				<Pricing.Price className="text-base font-medium" />
				<Pricing.BuyButton className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">
					Buy Ticket
				</Pricing.BuyButton>
			</Pricing.Product>
		</Pricing.Root>
	)
}

/**
 * Higher-order component that provides common pricing functionality
 * and data handling, while allowing for different pricing UI variations
 */
export const withEventPricing = (
	PricingComponent: React.ComponentType<PricingComponentProps>,
) => {
	return function WithEventPricing({
		pricingPropsLoader,
		post,
		pricingOptions,
	}: {
		pricingPropsLoader: Promise<ProductForPostProps | null>
		post: Post
		pricingOptions?: Partial<PricingOptions>
	}) {
		const pricingProps = React.use(pricingPropsLoader)
		if (!pricingProps) {
			return null
		}

		const {
			product,
			quantityAvailable,
			hasPurchasedCurrentProduct,
			pricingDataLoader,
		} = pricingProps
		const commerceProps = {
			...pricingProps,
			products: [product],
		}
		const purchasedProductIds =
			commerceProps?.purchases?.map((purchase) => purchase.productId) || []

		if (!product) return null

		const defaultPricingOptions = {
			withTitle: true,
			withImage: false,
			withGuaranteeBadge: false,
			isLiveEvent: true,
			teamQuantityLimit:
				quantityAvailable >= 0 && quantityAvailable > 5
					? 5
					: quantityAvailable < 0
						? 100
						: quantityAvailable,
			isPPPEnabled: true,
			cancelUrl: `${env.NEXT_PUBLIC_URL}/${post.fields?.slug || post.id}`,
			...pricingOptions,
		}

		return (
			<PriceCheckProvider purchasedProductIds={purchasedProductIds}>
				<PricingComponent
					hasPurchasedCurrentProduct={hasPurchasedCurrentProduct}
					commerceProps={commerceProps}
					product={product}
					quantityAvailable={quantityAvailable}
					pricingDataLoader={pricingDataLoader}
					pricingWidgetOptions={defaultPricingOptions}
				/>
			</PriceCheckProvider>
		)
	}
}

/**
 * Pre-configured event pricing components using the HOC
 */
export const EventPricing = withEventPricing(FullPricingWidget)
export const EventPricingButton = withEventPricing(BuyTicketButton)
export const EventPricingInline = withEventPricing(InlinePricingWidget)
