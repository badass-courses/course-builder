'use client'

import React from 'react'
import Link from 'next/link'
import Spinner from '@/components/spinner'
import { env } from '@/env.mjs'
import type { Cohort } from '@/lib/cohort'
import type { Event } from '@/lib/events'
import type { MinimalWorkshop, Workshop } from '@/lib/workshops'
import { api } from '@/trpc/react'
import { formatInTimeZone } from 'date-fns-tz'
import { BadgeCheck, ExternalLink } from 'lucide-react'
import { type CountdownRenderProps } from 'react-countdown'

import { CouponContext } from '@coursebuilder/commerce-next/coupons/coupon-context'
import { useCoupon } from '@coursebuilder/commerce-next/coupons/use-coupon'
import * as Pricing from '@coursebuilder/commerce-next/pricing/pricing'
import { PriceCheckProvider } from '@coursebuilder/commerce-next/pricing/pricing-check-context'
import { usePricing } from '@coursebuilder/commerce-next/pricing/pricing-context'
import type { PropsForCommerce } from '@coursebuilder/core/lib/pricing/props-for-commerce'
import { Product, Purchase } from '@coursebuilder/core/schemas'
import type {
	CommerceProps,
	FormattedPrice,
	PricingOptions,
} from '@coursebuilder/core/types'
import { formatUsd } from '@coursebuilder/core/utils/format-usd'
import { cn } from '@coursebuilder/ui/utils/cn'
import { getResourcePath } from '@coursebuilder/utils-resource/resource-paths'

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
	resourceType: string
	className?: string
}

/**
 * Buy ticket button only
 */
export const BuyButtonComponent: React.FC<
	PricingComponentProps & { centered?: boolean; resourceType: string }
> = ({
	product,
	commerceProps,
	pricingDataLoader,
	pricingWidgetOptions,
	hasPurchasedCurrentProduct,
	centered,
	className,
	resourceType,
}) => {
	const couponFromCode = commerceProps?.couponFromCode
	const { validCoupon } = useCoupon(couponFromCode)
	const couponId =
		commerceProps?.couponIdFromCoupon ||
		(validCoupon ? couponFromCode?.id : undefined)

	return hasPurchasedCurrentProduct ? (
		<PurchasedTicketInfo centered={centered} resourceType={resourceType} />
	) : (
		<Pricing.Root
			className={cn(
				'mt-4 items-start justify-start',
				centered && 'flex items-center justify-center',
				className,
			)}
			product={product}
			couponId={couponId}
			options={pricingWidgetOptions}
			userId={commerceProps?.userId}
			pricingDataLoader={pricingDataLoader}
		>
			<Pricing.Product>
				<Buy resourceType={resourceType} centered={centered} />
			</Pricing.Product>
		</Pricing.Root>
	)
}

const Buy = ({
	centered,
	resourceType,
}: {
	centered?: boolean
	resourceType: string
}) => {
	const {
		formattedPrice,
		status,
		product,
		pricingData: { quantityAvailable },
		isSoldOut,
	} = usePricing()
	const fullPrice = formattedPrice?.fullPrice || 0

	const finalPrice = formattedPrice?.calculatedPrice || 0
	const savings = fullPrice - finalPrice
	const savingsPercentage = Math.round((savings / fullPrice) * 100)

	return (
		<>
			<div
				className={cn(
					'flex flex-wrap items-center gap-5',
					centered && 'flex items-center justify-center',
				)}
			>
				<div className="flex flex-col items-start gap-2">
					<Pricing.BuyButton className="dark:bg-primary dark:hover:bg-primary/90 rounded-lg bg-blue-600 px-10 font-semibold hover:bg-blue-700">
						<span className="relative z-10">Buy Now</span>
						<span className="bg-primary-foreground/30 mx-3 h-full w-px" />
						<div className="relative z-10 flex items-baseline">
							{status === 'pending' ? (
								<Spinner className="w-5" />
							) : (
								<>
									<sup className="text-[10px] leading-tight opacity-50">US</sup>
									<span className="font-semibold tabular-nums">
										{formatUsd(finalPrice).dollars}
									</span>
									{savings > 0 && !isSoldOut && (
										<>
											<span className="ml-1 text-sm font-normal line-through opacity-90">
												{formatUsd(fullPrice).dollars}
											</span>
										</>
									)}
								</>
							)}
						</div>
					</Pricing.BuyButton>
				</div>
			</div>
		</>
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
		pricingProps,
		resource,
		pricingOptions,
		pricingDataLoader,
		centered = false,
		resourceType,
		className,
	}: {
		pricingProps: PropsForCommerce
		resource: Cohort | MinimalWorkshop
		pricingOptions?: Partial<PricingOptions>
		pricingDataLoader: Promise<PricingData>
		centered?: boolean
		resourceType: string
		className?: string
	}) {
		const { coupon } = React.useContext(CouponContext)

		if (!pricingProps) {
			return null
		}

		const commerceProps = {
			...pricingProps,
			couponFromCode: coupon,
			couponIdFromCoupon: coupon?.id,
		}

		const purchasedProductIds =
			commerceProps?.purchases?.map((purchase) => purchase.productId) || []

		const product = pricingProps.products[0]

		if (!product) return null

		const defaultPricingOptions = {
			withTitle: true,
			withImage: false,
			withGuaranteeBadge: false,
			isLiveEvent: true,
			teamQuantityLimit:
				product.quantityAvailable >= 0 && product.quantityAvailable > 5
					? 5
					: product.quantityAvailable < 0
						? 100
						: product.quantityAvailable,
			isPPPEnabled: true,
			cancelUrl: `${env.NEXT_PUBLIC_URL}/${(getResourcePath(resourceType, resource?.fields?.slug), 'view')}`,
			...pricingOptions,
		}
		const { openEnrollment, closeEnrollment } = product?.fields || {}
		const { startsAt, endsAt, timezone } = resource?.fields
		const tz = timezone || 'America/Los_Angeles'
		const nowInPT = new Date(
			formatInTimeZone(new Date(), tz, "yyyy-MM-dd'T'HH:mm:ssXXX"),
		)
		const isOpenEnrollment = openEnrollment
			? new Date(openEnrollment) < nowInPT &&
				(closeEnrollment ? new Date(closeEnrollment) > nowInPT : true)
			: false

		// Check if enrollment hasn't opened yet
		const enrollmentNotOpenYet = openEnrollment
			? new Date(openEnrollment) > nowInPT
			: false

		// Check if cohort has actually started (different from enrollment status)
		const hasStarted = startsAt ? new Date(startsAt) <= nowInPT : false

		const hasPurchasedCurrentProduct = commerceProps?.purchases?.some(
			(purchase) => purchase.productId === product.id,
		)

		return (
			<PriceCheckProvider purchasedProductIds={purchasedProductIds}>
				{hasStarted ? (
					<div className="font-heading flex w-full items-center justify-center py-5 text-lg font-medium">
						The Cohort Has Started
					</div>
				) : (
					<PricingComponent
						centered={centered}
						resourceType={resourceType}
						hasPurchasedCurrentProduct={hasPurchasedCurrentProduct}
						commerceProps={commerceProps}
						product={product}
						quantityAvailable={product.quantityAvailable}
						pricingDataLoader={pricingDataLoader}
						pricingWidgetOptions={defaultPricingOptions}
						className={className}
					/>
				)}
			</PriceCheckProvider>
		)
	}
}

const PurchasedTicketInfo = ({
	centered,
	resourceType,
}: {
	centered?: boolean
	resourceType: string
}) => {
	return (
		<div
			className={cn(
				'bg-primary/10 not-prose inline-flex flex-wrap items-center gap-1.5 rounded-md p-4 text-base sm:justify-start sm:text-lg',
				centered && 'justify-center',
			)}
		>
			<div className="inline-flex items-baseline gap-2 sm:items-center">
				<BadgeCheck className="text-primary size-4 flex-shrink-0 sm:size-5" />
				<p className="text-primary">
					{resourceType.charAt(0).toUpperCase() + resourceType.slice(1)}{' '}
					purchased. We sent the details of the cohort to your email.{' '}
					<Link
						target="_blank"
						href="/invoices"
						className="underline-offset-2 hover:underline"
					>
						<span className="inline-flex items-center gap-1 underline">
							Get Invoice
							<ExternalLink className="size-4" />
						</span>
					</Link>
				</p>
			</div>
		</div>
	)
}

/**
 * Pre-configured event pricing components using the HOC
 */

export const InlineBuyButton = withEventPricing(BuyButtonComponent)
