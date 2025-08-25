'use client'

import React from 'react'
import Link from 'next/link'
import { PricingWidget } from '@/app/(commerce)/products/[slug]/_components/pricing-widget'
import Spinner from '@/components/spinner'
import { env } from '@/env.mjs'
import type { Event } from '@/lib/events'
import { api } from '@/trpc/react'
import { BadgeCheck, ExternalLink } from 'lucide-react'
import { type CountdownRenderProps } from 'react-countdown'

import { CouponContext } from '@coursebuilder/commerce-next/coupons/coupon-context'
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
import { formatUsd } from '@coursebuilder/core/utils/format-usd'
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
	className?: string
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
	hasPurchasedCurrentProduct,
	className,
}) => {
	const couponFromCode = commerceProps?.couponFromCode
	const { validCoupon } = useCoupon(couponFromCode)
	const couponId =
		commerceProps?.couponIdFromCoupon ||
		(validCoupon ? couponFromCode?.id : undefined)
	const cancelUrl = pricingWidgetOptions?.cancelUrl || ''

	return hasPurchasedCurrentProduct ? (
		<PurchasedTicketInfo />
	) : (
		<div className={cn('mx-auto w-full max-w-sm py-10', className)}>
			<PricingWidget
				commerceProps={{ ...commerceProps, products: [product] }}
				ctaLabel="Reserve Your Spot"
				hasPurchasedCurrentProduct={hasPurchasedCurrentProduct}
				product={product}
				quantityAvailable={quantityAvailable}
				pricingDataLoader={pricingDataLoader}
				pricingWidgetOptions={{
					withTitle: false,
					withImage: false,
					withGuaranteeBadge: false,
					isLiveEvent: true,
					teamQuantityLimit:
						quantityAvailable >= 0 && quantityAvailable > 5
							? 5
							: quantityAvailable < 0
								? 100
								: quantityAvailable,
					isPPPEnabled: false,
					allowTeamPurchase: true,
					cancelUrl: cancelUrl,
				}}
			/>
		</div>
	)
}

const PurchasedTicketInfo = ({ centered }: { centered?: boolean }) => {
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
					Ticket purchased. We sent the details of the event to your email.{' '}
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

const TeamToggle = ({
	className,
	children,
}: {
	className?: string
	children?: React.ReactNode
}) => {
	const { isTeamPurchaseActive, toggleTeamPurchase } = usePricing()
	return (
		<div className={cn('flex flex-row gap-1 text-sm', className)}>
			{children || (
				<>
					Buying for team?{' '}
					<button
						type="button"
						aria-label="Switch to team pricing"
						onClick={() => {
							toggleTeamPurchase()
						}}
						className="text-primary font-semibold underline"
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
	className,
}) => {
	const couponFromCode = commerceProps?.couponFromCode
	const { validCoupon } = useCoupon(couponFromCode)
	const couponId =
		commerceProps?.couponIdFromCoupon ||
		(validCoupon ? couponFromCode?.id : undefined)

	return hasPurchasedCurrentProduct ? (
		<PurchasedTicketInfo centered={centered} />
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
				<BuyButton centered={centered} />
			</Pricing.Product>
		</Pricing.Root>
	)
}

const BuyButton = ({ centered }: { centered?: boolean }) => {
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
					<Pricing.BuyButton className="from-primary bg-linear-to-bl text-white! relative w-auto min-w-[260px] origin-bottom rounded-md to-indigo-800 px-6 py-6 text-lg font-semibold shadow-lg shadow-indigo-800/30 transition ease-in-out hover:hue-rotate-[8deg]">
						Buy Ticket
						<span className="bg-primary-foreground/30 mx-5 h-full w-px" />
						<div className="flex items-baseline">
							{status === 'pending' ? (
								<Spinner className="w-5" />
							) : (
								<>
									<sup className="text-xs leading-tight opacity-50">US</sup>
									<span className="font-semibold tabular-nums">
										{formatUsd(finalPrice).dollars}
									</span>
									{savings > 0 && !isSoldOut && (
										<>
											<span className="ml-1 text-lg font-normal line-through opacity-90">
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
			<div
				className={cn('mt-2 flex items-center', centered && 'justify-center')}
			>
				<Pricing.TeamQuantityInput
					className={cn('mb-0 w-auto px-0 xl:px-0', centered && 'w-full')}
				/>
			</div>
			{status === 'pending' ? null : (
				<>
					<div
						className={cn(
							'my-2 flex flex-wrap items-center',
							centered && 'justify-center',
						)}
					>
						{savings > 0 && !isSoldOut && (
							<>
								<span className="text-sm font-semibold">
									Save {savingsPercentage}%{' '}
								</span>
								<Pricing.SaleCountdown
									countdownRenderer={(props) => (
										<CountdownRenderer
											className={cn('', centered && 'text-center')}
											{...props}
										/>
									)}
								/>
							</>
						)}
						<Pricing.LiveQuantity
							className={cn(
								'text-foreground inline-flex w-auto text-balance bg-transparent px-0 py-0 text-left text-sm capitalize opacity-100',
								centered && 'text-center',
							)}
						/>
					</div>
					{!isSoldOut && (
						<>
							<TeamToggle
								className={cn(
									'',
									centered && 'w-full items-center justify-center text-center',
								)}
							/>
							<div className="inline-flex w-full items-center justify-center">
								<Pricing.LiveRefundPolicy
									className={cn(
										'inline-flex max-w-none pt-0 text-left',
										centered && 'text-center',
									)}
								/>
							</div>
						</>
					)}
				</>
			)}
		</>
	)
}

const CountdownRenderer: React.FC<
	React.PropsWithChildren<CountdownRenderProps & { className?: string }>
> = ({ days, hours, minutes, seconds, completed, className, ...rest }) => {
	return completed ? null : (
		<div className={cn('text-sm tabular-nums', className)}>
			・ Price increases in{' '}
			<span className="font-semibold">
				{days > 0 && `${days} days`}
				{days === 0 && hours > 0 && `${hours} hours`}
				{days === 0 && hours === 0 && minutes > 0 && `${minutes} minutes`}
				{days === 0 && hours === 0 && minutes === 0 && `${seconds} seconds`}
			</span>{' '}
			・
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
		<PurchasedTicketInfo />
	) : (
		<Pricing.Root
			className="relative flex w-full items-center justify-center border-t pt-8"
			product={product}
			couponId={couponId}
			options={pricingWidgetOptions}
			userId={commerceProps?.userId}
			pricingDataLoader={pricingDataLoader}
		>
			<Pricing.Product className="w-full">
				<CardPricing />
			</Pricing.Product>
		</Pricing.Root>
	)
}

const CardPricing = () => {
	const { formattedPrice, status } = usePricing()
	const fullPrice = formattedPrice?.fullPrice || 0

	const finalPrice = formattedPrice?.calculatedPrice || 0
	const savings = fullPrice - finalPrice
	const savingsPercentage = Math.round((savings / fullPrice) * 100)

	return (
		<>
			<div className={cn('flex flex-wrap items-center justify-between gap-5')}>
				<div className="flex items-center">
					{status === 'pending' ? (
						<Spinner className="w-5" />
					) : (
						<>
							<sup className="text-sm leading-tight opacity-50">US</sup>
							<span className="text-3xl font-semibold tabular-nums">
								{formatUsd(finalPrice).dollars}
							</span>
							{savings > 0 && (
								<div className="ml-1 flex flex-col">
									<span className="text-base font-normal leading-none line-through opacity-90">
										{formatUsd(fullPrice).dollars}
									</span>
									<span className="text-xs font-semibold opacity-90">
										Save {savingsPercentage}%{' '}
									</span>
								</div>
							)}
						</>
					)}
				</div>
				<div className="flex flex-col items-start gap-2">
					<Pricing.BuyButton className="from-primary bg-linear-to-bl text-white! relative w-auto min-w-[170px] origin-bottom rounded-md to-indigo-800 px-5 py-4 text-base font-semibold shadow-lg shadow-indigo-800/30 transition ease-in-out hover:hue-rotate-[8deg]">
						Buy Ticket
					</Pricing.BuyButton>
				</div>
			</div>
			<div className={cn('mt-2 flex items-center')}>
				<Pricing.TeamQuantityInput className={cn('mb-0 w-auto px-0 xl:px-0')} />
			</div>
			{status === 'pending' ? null : (
				<>
					<div className={cn('my-2 flex flex-wrap items-center')}>
						{savings > 0 && (
							<>
								<Pricing.SaleCountdown />
							</>
						)}
						<Pricing.LiveQuantity
							className={cn(
								'text-foreground inline-flex w-auto text-balance bg-transparent px-0 py-0 text-left text-sm capitalize opacity-100',
							)}
						/>
					</div>
					<TeamToggle className={cn('')} />
					<div className="inline-flex w-full items-center justify-center">
						<Pricing.LiveRefundPolicy
							className={cn('inline-flex max-w-none pt-0 text-left')}
						/>
					</div>
				</>
			)}
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
		event,
		pricingOptions,
		centered = false,
		className,
	}: {
		event: Event
		pricingOptions?: Partial<PricingOptions>
		centered?: boolean
		className?: string
	}) {
		const { coupon } = React.useContext(CouponContext)

		const { data: pricingProps, status } =
			api.pricing.getPostProductPricing.useQuery(
				{
					postSlugOrId: event.id,
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
						className,
					)}
				>
					<Spinner className="w-5" /> Loading ticket...
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
			couponFromCode: coupon,
			couponIdFromCoupon: coupon?.id,
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
			cancelUrl: `${env.NEXT_PUBLIC_URL}/events/${event.fields?.slug || event.id}`,
			...pricingOptions,
		}
		const isPastEvent =
			product.type === 'live' &&
			event.fields?.startsAt &&
			new Date(event.fields?.startsAt) < new Date()

		return (
			<PriceCheckProvider purchasedProductIds={purchasedProductIds}>
				{isPastEvent ? (
					<div className="flex w-full items-center justify-center py-5">
						Not Available
					</div>
				) : (
					<PricingComponent
						centered={centered}
						hasPurchasedCurrentProduct={hasPurchasedCurrentProduct}
						commerceProps={commerceProps}
						product={product}
						quantityAvailable={quantityAvailable}
						pricingDataLoader={pricingDataLoader}
						pricingWidgetOptions={defaultPricingOptions}
						className={className}
					/>
				)}
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
