'use client'

import React from 'react'
import Link from 'next/link'
import Spinner from '@/components/spinner'
import { env } from '@/env.mjs'
import type { Post, ProductForPostProps } from '@/lib/posts'
import { api } from '@/trpc/react'
import { BadgeCheck, ExternalLink, Shield } from 'lucide-react'

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
import { Button } from '@coursebuilder/ui'
import { cn } from '@coursebuilder/ui/utils/cn'

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
	centered?: boolean
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
				<div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
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
							<BuyButton />
							<Pricing.LiveRefundPolicy />
							<Pricing.PPPToggle />
						</div>
					</Pricing.Details>
				</div>
			</Pricing.Product>
		</Pricing.Root>
	)
}

const TeamToggle = ({
	className,
	children,
}: {
	className?: string
	children?: React.ReactNode
}) => {
	const { isTeamPurchaseActive, toggleTeamPurchase } = usePricing()
	return (
		<div className={'flex flex-row gap-1 text-sm'}>
			{children || (
				<>
					Buying for team?{' '}
					<button
						type="button"
						aria-label="Switch to team pricing"
						aria-checked={isTeamPurchaseActive}
						onClick={() => {
							toggleTeamPurchase()
						}}
						className="text-primary underline"
					>
						{isTeamPurchaseActive
							? 'Switch to individual pricing'
							: 'Switch to team pricing'}
					</button>
				</>
			)}
		</div>
	)
}

/**
 * Buy ticket button only
 */
export const BuyTicketButton: React.FC<
	PricingComponentProps & { centered?: boolean }
> = ({
	product,
	commerceProps,
	pricingDataLoader,
	pricingWidgetOptions,
	hasPurchasedCurrentProduct,
	centered,
}) => {
	const couponFromCode = commerceProps?.couponFromCode
	const { validCoupon } = useCoupon(couponFromCode)
	const couponId =
		commerceProps?.couponIdFromCoupon ||
		(validCoupon ? couponFromCode?.id : undefined)

	return hasPurchasedCurrentProduct ? (
		<div
			className={cn(
				'inline-flex items-center gap-3 rounded-md bg-green-50 px-4 py-2 text-sm',
				centered && 'justify-center',
			)}
		>
			<BadgeCheck className="h-4 w-4 text-green-600" />
			<span className="text-green-700">
				Ticket Purchased! We sent the details of the event to your email.
			</span>
			<Link href="/invoices" className="underline-offset-2 hover:underline">
				<span className="inline-flex items-center gap-1">
					Get Invoice
					<ExternalLink className="h-4 w-4" />
				</span>
			</Link>
		</div>
	) : (
		<Pricing.Root
			className={cn(
				'mt-4 items-start justify-start',
				centered && 'flex items-center justify-center',
			)}
			product={product}
			couponId={couponId}
			options={pricingWidgetOptions}
			userId={commerceProps?.userId}
			pricingDataLoader={pricingDataLoader}
		>
			<Pricing.Product>
				<div
					className={cn(
						'flex flex-wrap items-center gap-5',
						centered && 'flex items-center justify-center',
					)}
				>
					<BuyButton />
					<div className="flex items-center">
						<Pricing.TeamQuantityInput className="mb-0 px-0 xl:px-0" />
					</div>
				</div>
				<div
					className={cn(
						'mt-2 flex flex-wrap items-center gap-3',
						centered && 'justify-center',
					)}
				>
					<Pricing.LiveQuantity
						className={cn(
							'text-foreground inline-flex w-auto text-balance bg-transparent px-0 py-0 text-left text-sm capitalize opacity-100',
							centered && 'text-center',
						)}
					/>
					<TeamToggle />
				</div>
				<Pricing.LiveRefundPolicy className="w-full max-w-none pt-0 text-left" />
			</Pricing.Product>
		</Pricing.Root>
	)
}

const BuyButton = () => {
	const { formattedPrice, status } = usePricing()
	const fullPrice = formattedPrice?.fullPrice || 0
	const finalPrice = formattedPrice?.calculatedPrice || 0
	const savings = fullPrice - finalPrice
	const savingsPercentage = Math.round((savings / fullPrice) * 100)

	return (
		<div className="flex flex-col items-start gap-2">
			<div className="flex items-center gap-3">
				<div className="flex items-baseline">
					<span className="text-sm font-medium text-gray-500">US</span>
					<span className="ml-1 text-3xl font-bold">
						{status === 'pending' ? (
							<Spinner className="ml-1 w-5" />
						) : (
							formatUsd(finalPrice).dollars
						)}
					</span>
				</div>
				{savings > 0 && (
					<>
						<span className="text-muted-foreground line-through">
							{formatUsd(fullPrice).dollars}
						</span>
						<span className="rounded-md bg-green-100 px-2 py-1 text-sm font-medium text-green-800">
							Save {savingsPercentage}%
						</span>
					</>
				)}
			</div>
			<Pricing.BuyButton className="from-primary relative w-auto min-w-[260px] origin-bottom rounded-md bg-gradient-to-bl to-indigo-800 px-10 py-6 text-lg font-medium !text-white shadow-lg shadow-indigo-800/30 transition ease-in-out hover:hue-rotate-[8deg]">
				Buy Ticket
			</Pricing.BuyButton>
		</div>
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
		post,
		pricingOptions,
		centered = false,
	}: {
		post: Post
		pricingOptions?: Partial<PricingOptions>
		centered?: boolean
	}) {
		const { data: pricingProps, status } =
			api.pricing.getPostProductPricing.useQuery(
				{
					postSlugOrId: post.id,
				},
				{
					refetchOnWindowFocus: false,
					refetchOnMount: false,
				},
			)

		if (status === 'pending') {
			return (
				<div
					className={cn(
						'text-muted-foreground flex items-center gap-1 py-5 text-base',
						centered && 'flex items-center justify-center',
					)}
				>
					<Spinner className="w-5" /> Loading price...
				</div>
			)
		}

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
					centered={centered}
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
