import * as React from 'react'
import Image from 'next/image'
import { Slot } from '@radix-ui/react-slot'
import * as Switch from '@radix-ui/react-switch'
import pluralize from 'pluralize'
import Countdown, { type CountdownRenderProps } from 'react-countdown'

import { buildStripeCheckoutPath } from '@coursebuilder/core/pricing/build-stripe-checkout-path'
import { Product } from '@coursebuilder/core/schemas'
import { PricingData, PricingOptions } from '@coursebuilder/core/types'
import { formatUsd } from '@coursebuilder/core/utils/format-usd'
import { Button, Checkbox } from '@coursebuilder/ui'
import { cn } from '@coursebuilder/ui/utils/cn'

import { usePriceCheck } from './pricing-check-context'
import { PricingProvider, usePricing } from './pricing-context'

type RootProps = {
	className?: string
	asChild?: boolean
	product: Product
	couponId?: string | null | undefined
	country?: string
	options?: Partial<PricingOptions>
	userId?: string
	pricingDataLoader: Promise<PricingData>
}

const Root = ({
	children,
	...props
}: RootProps & { children: React.ReactNode }) => {
	return (
		<PricingProvider {...props}>
			<RootInternal {...props}>{children}</RootInternal>
		</PricingProvider>
	)
}

const RootInternal = ({
	children,
	asChild,
	className,
}: RootProps & { children: React.ReactNode }) => {
	const Comp = asChild ? Slot : 'div'
	const {
		options: { isLiveEvent },
	} = usePricing()

	return (
		<Comp className={cn('flex flex-col items-center', className)}>
			{children}
		</Comp>
	)
}

const PricingProduct = ({
	children,
	className,
}: {
	children: React.ReactNode
	className?: string
}) => {
	const {
		product,
		isTeamPurchaseActive,
		quantity,
		formattedPrice,
		userId,
		organizationId,
		options: { cancelUrl },
	} = usePricing()

	const isMembership = product.type === 'membership'

	const checkoutPath = buildStripeCheckoutPath({
		productId: formattedPrice?.id,
		couponId: formattedPrice?.appliedMerchantCoupon?.id,
		bulk: isTeamPurchaseActive,
		quantity,
		userId,
		upgradeFromPurchaseId: formattedPrice?.upgradeFromPurchaseId,
		cancelUrl,
		usedCouponId: formattedPrice?.usedCouponId,
		organizationId,
	})

	return (
		<form className={cn('', className)} action={checkoutPath} method="POST">
			{children}
		</form>
	)
}

const Details = ({
	children,
	className,
}: {
	children: React.ReactNode
	className?: string
}) => {
	const {
		options: { isLiveEvent },
		isPreviouslyPurchased,
	} = usePricing()

	return isPreviouslyPurchased ? null : (
		<article
			className={cn(
				'flex flex-col items-center rounded-none border-none bg-transparent pt-5',
				className,
			)}
		>
			{children}
		</article>
	)
}

const ProductImage = ({
	className,
	children,
}: {
	className?: string
	children?: React.ReactNode
}) => {
	const {
		product,
		options: { withImage },
	} = usePricing()
	return withImage ? (
		<div className={cn('relative mx-auto size-56', className)}>
			{children ||
				(product.fields.image && (
					<Image
						priority
						src={product.fields.image.url}
						alt={product.fields.image.alt || product.name}
						quality={100}
						layout={'fill'}
						objectFit="contain"
						aria-hidden="true"
					/>
				))}
		</div>
	) : null
}

const Name = ({
	className,
	children,
}: {
	className?: string
	children?: React.ReactNode
}) => {
	const {
		product,
		options: { withTitle },
	} = usePricing()
	return withTitle ? (
		<div
			className={cn(
				'mt-3 text-balance px-5 text-center text-xl font-bold sm:text-2xl',
				className,
			)}
		>
			{children || product.name}
		</div>
	) : null
}

const PriceSpinner: React.FunctionComponent<{
	className?: string
}> = ({ className = 'w-8 h-8', ...rest }) => (
	<svg
		className={cn('animate-spin', className)}
		xmlns="http://www.w3.org/2000/svg"
		fill="none"
		viewBox="0 0 24 24"
		{...rest}
	>
		<title>Loading</title>
		<circle
			opacity={0.25}
			cx="12"
			cy="12"
			r="10"
			stroke="currentColor"
			strokeWidth="4"
		/>
		<path
			opacity={0.75}
			fill="currentColor"
			d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
		/>
	</svg>
)

const Price = ({
	className,
	children,
}: {
	className?: string
	children?: React.ReactNode
}) => {
	const { formattedPrice, status } = usePricing()
	const { isDiscount } = usePriceCheck()

	const appliedMerchantCoupon = formattedPrice?.appliedMerchantCoupon

	const fullPrice = formattedPrice?.fullPrice

	const percentOff = appliedMerchantCoupon
		? Math.floor(+(appliedMerchantCoupon.percentageDiscount ?? 0) * 100)
		: formattedPrice && isDiscount(formattedPrice)
			? Math.floor(
					((formattedPrice.unitPrice - formattedPrice.calculatedPrice) /
						formattedPrice.unitPrice) *
						100,
				)
			: 0

	const percentOffLabel =
		appliedMerchantCoupon && `${percentOff}% off of $${fullPrice}`
	return (
		<div className={cn('flex flex-col items-center', className)}>
			{children || (
				<div
					className={cn(
						'mt-2 flex h-[76px] items-center justify-center gap-0.5',
						{
							'flex h-[76px] items-center': status === 'pending',
							hidden: status === 'error',
						},
					)}
				>
					{status === 'pending' ? (
						<div className="flex h-12 items-center justify-center">
							<span className="sr-only">Loading price</span>
							<PriceSpinner aria-hidden="true" className="h-8 w-8" />
						</div>
					) : (
						<>
							<sup
								className="font-heading -mt-3 text-base font-semibold opacity-60"
								aria-hidden="true"
							>
								US
							</sup>
							<div
								aria-live="polite"
								className="text-foreground font-heading flex text-6xl font-bold"
							>
								{formattedPrice?.calculatedPrice &&
									formatUsd(formattedPrice?.calculatedPrice).dollars}
								<span
									className="sup font-heading mt-1 pl-0.5 align-sub text-base text-sm opacity-60"
									aria-hidden="true"
								>
									{formattedPrice?.calculatedPrice &&
										formatUsd(formattedPrice?.calculatedPrice).cents}
								</span>
								{Boolean(
									appliedMerchantCoupon || isDiscount(formattedPrice),
								) && (
									<>
										<div
											aria-hidden="true"
											className="mt-1.5 flex flex-col items-center pl-3 font-normal"
										>
											<div className="text-foreground relative flex text-2xl leading-none line-through">
												{'$' + fullPrice}
											</div>
											<div className="text-primary text-base">
												Save {percentOff}%
											</div>
										</div>
										<div className="sr-only">
											{appliedMerchantCoupon?.type === 'bulk' ? (
												<div>Team discount.</div>
											) : null}{' '}
											{percentOffLabel}
										</div>
									</>
								)}
							</div>
						</>
					)}
				</div>
			)}
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
	const isSoldOut = usePricing().isSoldOut

	if (isSoldOut) return null

	return (
		<div
			className={cn(
				'flex items-center justify-center gap-2 pb-3.5 text-sm',
				className,
			)}
		>
			{children || (
				<>
					<label className="sr-only" htmlFor="team-switch">
						Buying for myself or for my team
					</label>
					<button
						className="decoration-gray-600 underline-offset-2 transition hover:underline"
						role="button"
						type="button"
						onClick={toggleTeamPurchase}
					>
						For myself
					</button>
					<Switch.Root
						className="relative h-6 w-[47px] rounded-full border border-gray-300/50 bg-gray-200 shadow-md shadow-gray-300/30 transition hover:bg-gray-300/50 data-[state='checked']:bg-gray-200 hover:data-[state='checked']:bg-gray-300/50 dark:border-gray-800 dark:bg-gray-950 dark:shadow-transparent dark:hover:bg-gray-900 dark:data-[state='checked']:bg-gray-950"
						aria-label={isTeamPurchaseActive ? 'For my team' : 'For myself'}
						onCheckedChange={toggleTeamPurchase}
						checked={isTeamPurchaseActive}
						id="team-switch"
					>
						<Switch.Thumb className="shadow-2xs block h-[18px] w-[18px] translate-x-[2px] rounded-full bg-gray-500 shadow-gray-300/50 transition-all will-change-transform group-hover:bg-gray-300 data-[state='checked']:translate-x-[25px] data-[state='checked']:bg-blue-500 data-[state='checked']:group-hover:bg-indigo-400" />
					</Switch.Root>
					<button
						className="decoration-gray-600 underline-offset-2 transition hover:underline"
						role="button"
						type="button"
						onClick={toggleTeamPurchase}
					>
						For my team
					</button>
				</>
			)}
		</div>
	)
}

const TeamQuantityInput = ({
	className,
	children,
	label = 'Team Seats',
}: {
	className?: string
	children?: React.ReactNode
	label?: string
}) => {
	const {
		product,
		quantity,
		options: { teamQuantityLimit },
		updateQuantity,
		setMerchantCoupon,
		pricingData: { quantityAvailable },
		isTeamPurchaseActive,
		isBuyingMoreSeats,
	} = usePricing()

	return isTeamPurchaseActive || isBuyingMoreSeats ? (
		<div
			className={cn(
				'mb-5 flex w-full flex-col items-center justify-center px-5 xl:px-12',
				className,
			)}
		>
			{children || (
				<>
					<div className="flex items-center gap-1 text-sm font-medium">
						<label className="mr-3 opacity-80">{label}</label>
						<button
							type="button"
							className="flex h-full items-center justify-center rounded bg-gray-200/60 px-3 py-2 font-mono sm:hidden"
							aria-label="decrease seat quantity by one"
							onClick={() => {
								if (quantity === 1) return
								updateQuantity(quantity - 1)
							}}
						>
							-
						</button>
						<input
							type="number"
							className="max-w-[70px] rounded-md border border-gray-200 bg-gray-200/60 py-2 pl-3 font-mono font-bold ring-blue-500 dark:border-gray-800 dark:bg-gray-950"
							min={1}
							max={teamQuantityLimit}
							step={1}
							onChange={(e) => {
								const quantity = Number(e.target.value)

								const newQuantity =
									quantity < 1
										? 1
										: teamQuantityLimit && quantity > teamQuantityLimit
											? teamQuantityLimit
											: quantity

								setMerchantCoupon(undefined)
								updateQuantity(newQuantity)
							}}
							onKeyDown={(e) => {
								// don't allow decimal
								if (e.key === ',') {
									e.preventDefault()
								}
							}}
							inputMode="numeric"
							pattern="[0-9]*"
							value={
								teamQuantityLimit !== 0 && teamQuantityLimit < quantity
									? teamQuantityLimit
									: quantity
							}
							id={`${quantity}-${product.name}`}
							required={true}
						/>
						<button
							type="button"
							aria-label="increase seat quantity by one"
							className="flex h-full items-center justify-center rounded bg-gray-200/60 px-3 py-2 font-mono sm:hidden"
							onClick={() => {
								if (quantity === 100) return
								updateQuantity(quantity + 1)
							}}
						>
							+
						</button>
					</div>
				</>
			)}
		</div>
	) : null
}

const BuyButton = ({
	className,
	children,
	asChild,
}: {
	className?: string
	children?: React.ReactNode
	asChild?: boolean
}) => {
	const Comp = asChild ? Slot : Button
	const {
		formattedPrice,
		product,
		status,
		pricingData: { quantityAvailable },
		couponId,
		isSoldOut,
	} = usePricing()

	return (
		<Comp
			className={cn(
				'bg-primary text-primary-foreground flex h-14 w-full items-center justify-center rounded px-4 py-4 text-center text-base font-medium transition ease-in-out disabled:cursor-not-allowed disabled:opacity-50',
				className,
			)}
			type="submit"
			size="lg"
			disabled={status === 'pending' || status === 'error' || isSoldOut}
		>
			{children
				? children
				: isSoldOut
					? 'Sold Out'
					: formattedPrice?.upgradeFromPurchaseId
						? `Upgrade Now`
						: product?.fields.action || `Buy Now`}
		</Comp>
	)
}

const GuaranteeBadge = ({
	className,
	children,
}: {
	className?: string
	children?: React.ReactNode
}) => {
	const {
		options: { withGuaranteeBadge },
	} = usePricing()
	return withGuaranteeBadge
		? children || (
				<span
					className={cn(
						'block pt-3 text-center text-xs text-gray-600 dark:text-gray-400',
						className,
					)}
				>
					30-Day Money-Back Guarantee
				</span>
			)
		: null
}

const LiveRefundPolicy = ({
	className,
	children,
}: {
	className?: string
	children?: React.ReactNode
}) => {
	const {
		options: { isLiveEvent },
	} = usePricing()
	return isLiveEvent
		? children || (
				<span
					className={cn(
						'inline-flex max-w-sm text-balance pt-3 text-center text-sm opacity-75',
						className,
					)}
				>
					Tickets to live events are non-refundable, but can be transferred
				</span>
			)
		: null
}

const PPPToggle = ({
	className,
	children,
}: {
	className?: string
	children?: React.ReactNode
}) => {
	const {
		options: { isPPPEnabled },
		formattedPrice,
		isTeamPurchaseActive,
		isPreviouslyPurchased,
		setMerchantCoupon,
		pricingData: { purchaseToUpgrade },
		allowPurchase,
		activeMerchantCoupon,
	} = usePricing()

	const { isDowngrade } = usePriceCheck()

	const availablePPPCoupon = formattedPrice?.availableCoupons.find(
		(coupon) => coupon?.type === 'ppp',
	)

	const appliedPPPCoupon =
		activeMerchantCoupon?.type === 'ppp' ? activeMerchantCoupon : null

	const allowPurchaseWith: { [key: string]: boolean } = {
		pppCoupon: true,
	}

	const getNumericValue = (
		value: string | number | Partial<{ toNumber: () => number }> | undefined,
	): number => {
		if (typeof value === 'string') {
			return Number(value)
		} else if (typeof value === 'number') {
			return value
		} else if (typeof value?.toNumber === 'function') {
			return value.toNumber()
		} else {
			return 0
		}
	}

	const showPPPBox =
		allowPurchase &&
		isPPPEnabled &&
		Boolean(availablePPPCoupon || appliedPPPCoupon) &&
		!isPreviouslyPurchased &&
		!isDowngrade(formattedPrice) &&
		!isTeamPurchaseActive &&
		allowPurchaseWith?.pppCoupon

	const regionNames = new Intl.DisplayNames(['en'], { type: 'region' })

	if (availablePPPCoupon && !availablePPPCoupon?.country) {
		console.error('No country found for PPP coupon', { availablePPPCoupon })
		return null
	}

	const countryCode = availablePPPCoupon?.country || 'US'
	const country = regionNames.of(countryCode)
	const percentageDiscount = getNumericValue(
		availablePPPCoupon?.percentageDiscount || 0,
	)
	const percentOff = Math.floor(percentageDiscount * 100)

	// if we are upgrading a Core(PPP) to a Bundle(PPP) and the PPP coupon is
	// valid and auto-applied then we hide the checkbox to reduce confusion.
	const hideCheckbox = Boolean(purchaseToUpgrade)

	return showPPPBox
		? children || (
				<div className={cn('pt-5 text-sm', className)}>
					<div data-ppp-header="">
						<strong>
							We noticed that you&apos;re from{' '}
							<img
								className="inline-block"
								src={`https://hardcore-golick-433858.netlify.app/image?code=${countryCode}`}
								alt={`${country} flag`}
								width={18}
								height={14}
							/>{' '}
							{country}. To help facilitate global learning, we are offering
							purchasing power parity pricing.
						</strong>
						<p className="pt-3">
							Please note that you will only be able to view content from within{' '}
							{country}, and no bonuses will be provided.
						</p>
						{!hideCheckbox && (
							<p className="pt-3">If that is something that you need:</p>
						)}
					</div>
					{!hideCheckbox && (
						<label className="mt-5 flex cursor-pointer items-center gap-2 rounded-md border border-gray-200 bg-white p-3 transition hover:bg-gray-100 dark:border-transparent dark:bg-gray-800 dark:hover:bg-gray-700/80">
							<Checkbox
								checked={Boolean(appliedPPPCoupon)}
								onCheckedChange={() => {
									if (appliedPPPCoupon) {
										setMerchantCoupon(undefined)
									} else {
										setMerchantCoupon(availablePPPCoupon as any)
									}
								}}
							/>
							<span className="font-semibold">
								Activate {percentOff}% off with regional pricing
							</span>
						</label>
					)}
				</div>
			)
		: null
}

const LiveQuantity = ({
	children,
	className,
}: {
	children?: React.ReactNode
	className?: string
}) => {
	const {
		product,
		isPreviouslyPurchased,
		options: { isLiveEvent },
		pricingData: { quantityAvailable },
		formattedPrice,
		isSoldOut,
	} = usePricing()

	return isLiveEvent && !isSoldOut && quantityAvailable !== -1
		? children || (
				<div
					className={cn(
						{
							'bg-foreground/20 text-foreground inline-flex items-center rounded px-2.5 pb-1.5 pt-1 text-center text-sm font-medium uppercase leading-none':
								!isSoldOut,
							'inline-flex rounded bg-red-300/20 px-2 py-1 text-center text-sm font-medium uppercase leading-none text-red-300':
								isSoldOut,
						},
						className,
					)}
				>
					{isSoldOut
						? 'Sold out'
						: `${pluralize('spot', quantityAvailable, true)} left`}
				</div>
			)
		: null
}

type PurchasedProps = {
	asChild?: boolean
	className?: string
}

const Purchased = ({
	children,
	asChild,
	className,
}: PurchasedProps & { children: React.ReactNode }) => {
	const Comp = asChild ? Slot : 'div'
	const {
		options: { isLiveEvent },
		isPreviouslyPurchased,
	} = usePricing()

	return isPreviouslyPurchased ? (
		<Comp className={cn('flex flex-col items-center', className)}>
			{children}
		</Comp>
	) : null
}

type BuyMoreSeatsToggleProps = {
	asChild?: boolean
	className?: string
	children?: React.ReactNode
}

const BuyMoreSeatsToggle = ({
	asChild,
	className,
	children,
}: BuyMoreSeatsToggleProps) => {
	const Comp = asChild ? Slot : Button
	const {
		options: { isLiveEvent },
		toggleBuyingMoreSeats,
		isBuyingMoreSeats,
	} = usePricing()

	return isLiveEvent ? null : (
		<Comp
			onClick={toggleBuyingMoreSeats}
			variant="outline"
			type="button"
			className={cn('flex flex-col items-center', className)}
		>
			{children || isBuyingMoreSeats ? 'Cancel' : 'Buy More Seats'}
		</Comp>
	)
}

type BuyMoreSeatsProps = {
	asChild?: boolean
	className?: string
	children?: React.ReactNode
}

const BuyMoreSeats = ({ asChild, className, children }: BuyMoreSeatsProps) => {
	const Comp = asChild ? Slot : 'div'
	const { isBuyingMoreSeats } = usePricing()

	return isBuyingMoreSeats ? (
		<Comp className={cn('flex w-full flex-col items-center', className)}>
			{children || (
				<>
					<TeamQuantityInput label="Quantity" />
					<Price />
					<BuyButton>Buy Additional Seats</BuyButton>
				</>
			)}
		</Comp>
	) : null
}

const SaleCountdown = ({
	className,
	countdownRenderer = (props) => <CountdownRenderer {...props} />,
}: {
	className?: string
	countdownRenderer?: (
		props: CountdownRenderProps & { className?: string },
	) => React.ReactElement
}) => {
	const {
		formattedPrice,
		product,
		pricingData: { quantityAvailable },
		isSoldOut,
	} = usePricing()

	if (isSoldOut) return null

	return formattedPrice?.defaultCoupon?.expires ? (
		<Countdown
			className={cn('', className)}
			date={formattedPrice?.defaultCoupon?.expires}
			renderer={(props) => countdownRenderer({ className, ...props })}
		/>
	) : null
}

const CountdownRenderer: React.FC<
	React.PropsWithChildren<CountdownRenderProps & { className?: string }>
> = ({ days, hours, minutes, seconds, completed, className, ...rest }) => {
	const [screenReaderValues] = React.useState({
		days,
		hours,
		minutes,
		seconds,
	})
	const forScreenReader = `${screenReaderValues.days} days, ${screenReaderValues.hours} hours, ${screenReaderValues.minutes} minutes, and ${screenReaderValues.seconds} seconds`

	return completed ? null : (
		<>
			<div className={cn('w-full', className)}>
				<div className="w-full text-center">
					<p className="pb-5 font-medium">Hurry! Price goes up in:</p>
					<div
						aria-hidden="true"
						data-grid=""
						className="mx-auto grid max-w-[300px] grid-cols-4 items-center justify-center gap-2 tabular-nums tracking-tight"
					>
						<div className="flex flex-col">
							<span
								data-number="days"
								className="text-3xl font-medium leading-none"
							>
								{days}
							</span>
							<span
								data-label="days"
								className="pt-1 text-xs font-medium uppercase tracking-wide text-gray-500"
							>
								days
							</span>
						</div>
						<div className="flex flex-col">
							<span
								data-number="hours"
								className="text-3xl font-medium leading-none"
							>
								{hours}
							</span>
							<span
								data-label="hours"
								className="pt-1 text-xs font-medium uppercase tracking-wide text-gray-500"
							>
								hours
							</span>
						</div>
						<div className="flex flex-col">
							<span
								data-number="minutes"
								className="text-3xl font-medium leading-none"
							>
								{minutes}
							</span>
							<span
								data-label="minutes"
								className="pt-1 text-xs font-medium uppercase tracking-wide text-gray-500"
							>
								minutes
							</span>
						</div>
						<div className="flex flex-col">
							<span
								data-number="seconds"
								className="text-3xl font-medium leading-none"
							>
								{seconds}
							</span>
							<span
								data-label="seconds"
								className="pt-1 text-xs font-medium uppercase tracking-wide text-gray-500"
							>
								seconds
							</span>
						</div>
					</div>
					<div className="sr-only">{forScreenReader}</div>
				</div>
			</div>
		</>
	)
}

const Waitlist = ({
	className,
	children,
}: {
	className?: string
	children?: React.ReactNode
}) => {
	// if no spots are available, show a waitlist form
	const {
		product,
		pricingData: { quantityAvailable },
		formattedPrice,
		isSoldOut,
	} = usePricing()

	if (!isSoldOut) return null

	return <div className={cn('', className)}>{children}</div>
}

export {
	Root,
	PricingProduct as Product,
	ProductImage,
	Name,
	Details,
	Price,
	TeamToggle,
	TeamQuantityInput,
	BuyButton,
	GuaranteeBadge,
	LiveRefundPolicy,
	PPPToggle,
	LiveQuantity,
	Purchased,
	BuyMoreSeatsToggle,
	BuyMoreSeats,
	SaleCountdown,
	Waitlist,
}
