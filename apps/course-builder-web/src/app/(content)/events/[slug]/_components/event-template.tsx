'use client'

import * as React from 'react'
import { Suspense, use } from 'react'
import {
	useParams,
	usePathname,
	useRouter,
	useSearchParams,
} from 'next/navigation'
import {
	CommerceProps,
	CouponForCode,
	EventPageProps,
} from '@/app/(content)/events/[slug]/page'
import { Layout } from '@/components/app/layout'
import { env } from '@/env.mjs'
import { Event } from '@/lib/events'
import { PricingData } from '@/lib/pricing-query'
import { buildStripeCheckoutPath } from '@/path-to-purchase/build-stripe-checkout-path'
import * as Switch from '@radix-ui/react-switch'
import { QueryStatus } from '@tanstack/react-query'
import { formatInTimeZone } from 'date-fns-tz'
import { AnimatePresence, motion } from 'framer-motion'
import { find, first } from 'lodash'
import { CheckCircleIcon } from 'lucide-react'
import pluralize from 'pluralize'
import qs from 'query-string'
import ReactMarkdown from 'react-markdown'
import Balancer from 'react-wrap-balancer'
import { number, record, z } from 'zod'

import { Product } from '@coursebuilder/core/schemas'
import { FormattedPrice } from '@coursebuilder/core/types'
import { cn } from '@coursebuilder/ui/utils/cn'

import { PriceCheckProvider, usePriceCheck } from './pricing-check-context'

export const SubscriberSchema = z.object({
	id: z.number(),
	first_name: z.string().nullish(),
	email_address: z.string().optional(),
	state: z.string().optional(),
	fields: record(z.string().nullable()).default({}),
	created_at: z.string().optional(),
})

export type Subscriber = z.infer<typeof SubscriberSchema>

const formatUsd = (amount: number = 0) => {
	const formatter = new Intl.NumberFormat('en-US', {
		style: 'currency',
		currency: 'USD',
	})
	const formattedPrice = formatter.format(amount).split('.')

	return { dollars: formattedPrice[0], cents: formattedPrice[1] }
}

export const redirectUrlBuilder = (
	subscriber: Subscriber,
	path: string,
	queryParams?: {
		[key: string]: string
	},
) => {
	const url = qs.stringifyUrl({
		url: path,
		query: {
			ck_subscriber_id: subscriber.id,
			email: subscriber.email_address,
			...queryParams,
		},
	})
	return url
}

export async function EventTemplate(props: EventPageProps) {
	const path = usePathname()
	const {
		event,
		mdx,
		products,
		quantityAvailable,
		purchaseCount,
		totalQuantity,
		pricingDataLoader,
		...commerceProps
	} = props
	const { fields, createdAt, updatedAt } = event
	const { title, body, startsAt, endsAt, slug, timezone, description } = fields

	const product = products && products[0]
	const pageDescription = description
	const hostName = 'Your Instructor'
	const url = `${env.NEXT_PUBLIC_URL}/${path}`

	const purchasedProductIds =
		commerceProps?.purchases?.map((purchase) => purchase.productId) || []
	const hasPurchase = purchasedProductIds.length > 0

	const isUpcoming = startsAt
		? new Date(startsAt) > new Date()
		: startsAt
			? new Date(startsAt) > new Date()
			: false

	return (
		<Layout>
			<main
				data-event={slug}
				className="mx-auto flex w-full max-w-screen-lg flex-col gap-8 px-5 py-5 md:flex-row md:py-16"
			>
				<div className="w-full">
					<h1 className="fluid-3xl w-full font-semibold tracking-tight">
						<Balancer>{title}</Balancer>
					</h1>

					<hr className="bg-border my-10 flex h-px w-full" />
					<article className="invert-svg prose dark:prose-invert md:prose-xl prose-code:break-words md:prose-code:break-normal mx-auto w-full max-w-none"></article>
				</div>
				<aside className="relative mx-auto w-full max-w-xs">
					<div className="shadow-soft-xl dark:bg-foreground/5 flex w-full flex-col items-center rounded-xl bg-white pb-5">
						{product && product.status === 1 && isUpcoming && (
							<PriceCheckProvider purchasedProductIds={purchasedProductIds}>
								<EventPricingWidget
									commerceProps={{ ...commerceProps, products }}
									product={product}
									quantityAvailable={quantityAvailable}
									pricingDataLoader={pricingDataLoader}
								/>
							</PriceCheckProvider>
						)}
						<EventDetails event={event} />
					</div>
				</aside>
			</main>
		</Layout>
	)
}

export const EventDetails: React.FC<{
	event: Event
}> = ({ event }) => {
	const { startsAt, endsAt, timezone } = event.fields
	const PT = 'America/Los_Angeles'
	const eventDate =
		startsAt && `${formatInTimeZone(new Date(startsAt), PT, 'MMMM d, yyyy')}`

	const eventTime =
		startsAt &&
		endsAt &&
		`${formatInTimeZone(new Date(startsAt), PT, 'h:mm a')} — ${formatInTimeZone(
			new Date(endsAt),
			PT,
			'h:mm a',
		)}`

	interface GroupedEvents {
		[title: string]: {
			dates: string[]
			time: string
		}
	}

	return (
		<div className="mt-5 flex flex-col border-t pt-5">
			<h2 className="px-5 pb-4 text-xl font-semibold">Event Details</h2>

			<div className="flex flex-col text-base font-semibold opacity-90">
				<div className="flex items-center gap-2 px-5 py-2">
					{/*<CalendarIcon className="h-5 w-5 flex-shrink-0 text-gray-600 dark:text-blue-300" />{' '}*/}
					{eventDate}
				</div>
				<div className="flex items-baseline gap-2 px-5 py-2">
					{/*<ClockIcon className="relative h-5 w-5 flex-shrink-0 translate-y-1 text-gray-600 dark:text-blue-300" />{' '}*/}
					<div>
						{eventTime} (Pacific time){' '}
						{timezone && (
							<a
								href={timezone}
								rel="noopener noreferrer"
								target="_blank"
								className="font-normal underline"
							>
								timezones
							</a>
						)}
					</div>
				</div>
				<div className="flex items-center gap-2 px-5 py-2">
					{/*<LocationMarkerIcon className="h-5 w-5 text-gray-600 dark:text-blue-300" />{' '}*/}
					Zoom (online remote)
				</div>
			</div>
		</div>
	)
}

const EventPricingWidget: React.FC<{
	product: any
	quantityAvailable: number
	commerceProps: CommerceProps
	pricingDataLoader: Promise<PricingData>
}> = ({ product, quantityAvailable, commerceProps, pricingDataLoader }) => {
	const pathname = usePathname()
	const params = useParams()
	const searchParams = useSearchParams()
	const couponFromCode = commerceProps?.couponFromCode
	const { validCoupon } = { validCoupon: false } //useCoupon(commerceProps?.couponFromCode)
	const couponId =
		commerceProps?.couponIdFromCoupon ||
		(validCoupon ? couponFromCode?.id : undefined)
	const purchases = commerceProps?.purchases || []
	const purchasedProductIds = purchases.map((purchase) => purchase.productId)
	const ALLOW_PURCHASE = true
	const cancelUrl = process.env.NEXT_PUBLIC_URL + pathname
	const hasPurchased = purchasedProductIds.includes(product.productId)
	return (
		<div data-pricing-container="" id="buy" key={product.name}>
			<Pricing
				pricingDataLoader={pricingDataLoader}
				cancelUrl={cancelUrl}
				allowPurchase={ALLOW_PURCHASE}
				userId={commerceProps?.userId}
				product={product}
				options={{
					withImage: false,
					withGuaranteeBadge: false,
					isLiveEvent: true,
					teamQuantityLimit:
						quantityAvailable && quantityAvailable > 5 ? 5 : quantityAvailable,
					isPPPEnabled: false,
				}}
				purchased={hasPurchased}
				couponId={couponId}
				couponFromCode={couponFromCode}
			/>
		</div>
	)
}

type PricingProps = {
	product: Product
	purchased?: boolean
	userId?: string
	index?: number
	couponId?: string
	couponFromCode?: CouponForCode | null
	cancelUrl?: string
	allowPurchase?: boolean
	canViewRegionRestriction?: boolean
	bonuses?: {
		title: string
		slug: string
		description?: string
		image?: string
		expiresAt?: string
	}[]
	purchaseButtonRenderer?: (
		formattedPrice: any,
		product: Product,
		status: QueryStatus,
	) => React.ReactNode
	options?: {
		withImage?: boolean
		withGuaranteeBadge?: boolean
		isLiveEvent?: boolean
		isPPPEnabled?: boolean
		teamQuantityLimit?: number
		saleCountdownRenderer?: ({ coupon }: { coupon: any }) => React.ReactNode
	}
	id?: string
	pricingDataLoader: Promise<PricingData>
}

function useDebounce<T>(value: T, delay: number): T {
	// State and setters for debounced value
	const [debouncedValue, setDebouncedValue] = React.useState<T>(value)
	React.useEffect(
		() => {
			// Update debounced value after delay
			const handler = setTimeout(() => {
				setDebouncedValue(value)
			}, delay)
			// Cancel the timeout if value changes (also on delay change or unmount)
			// This is how we prevent debounced value from updating if value is changed ...
			// .. within the delay period. Timeout gets cleared and restarted.
			return () => {
				clearTimeout(handler)
			}
		},
		[value, delay], // Only re-call effect if value or delay changes
	)
	return debouncedValue
}

export const Pricing: React.FC<React.PropsWithChildren<PricingProps>> = ({
	pricingDataLoader,
	product,
	purchased = false,
	userId,
	index = 0,
	bonuses,
	couponId,
	couponFromCode,
	allowPurchase: generallyAllowPurchase = false,
	canViewRegionRestriction = false,
	cancelUrl,
	id = 'main-pricing',
	purchaseButtonRenderer = (formattedPrice, product, status) => {
		return (
			<button
				data-pricing-product-checkout-button=""
				type="submit"
				disabled={status === 'pending' || status === 'error'}
			>
				<span>
					{formattedPrice?.upgradeFromPurchaseId
						? `Upgrade Now`
						: product?.fields.action || `Buy Now`}
				</span>
			</button>
		)
	},
	options = {
		withImage: true,
		isPPPEnabled: true,
		withGuaranteeBadge: true,
		isLiveEvent: false,
		saleCountdownRenderer: () => null,
		teamQuantityLimit: 100,
	},
}) => {
	const {
		withImage = true,
		isPPPEnabled = true,
		withGuaranteeBadge = true,
		isLiveEvent = false,
		teamQuantityLimit = 100,
	} = options
	const {
		addPrice,
		isDowngrade,
		merchantCoupon,
		setMerchantCoupon,
		quantity,
		setQuantity,
	} = usePriceCheck()
	const [isBuyingForTeam, setIsBuyingForTeam] = React.useState(false)
	const debouncedQuantity: number = useDebounce<number>(quantity, 250)
	const {
		id: productId,
		name,
		// image,
		// modules,
		// features,
		// lessons,
		// action,
		// title,
		fields,
	} = product
	const { title } = fields
	// const { subscriber, loadingSubscriber } = useConvertkit()
	const router = useRouter()
	const [autoApplyPPP, setAutoApplyPPP] = React.useState<boolean>(true)

	const { formattedPrice, purchaseToUpgrade, quantityAvailable } =
		use(pricingDataLoader)

	const defaultCoupon = formattedPrice?.defaultCoupon
	const appliedMerchantCoupon = formattedPrice?.appliedMerchantCoupon

	console.log({ formattedPrice, purchaseToUpgrade, quantityAvailable })

	const allowPurchaseWithSpecialCoupon = Boolean(
		appliedMerchantCoupon &&
			appliedMerchantCoupon.type === 'special' &&
			appliedMerchantCoupon.id === couponFromCode?.merchantCouponId,
	)

	const allowPurchaseWith: { [key: string]: boolean } = {
		pppCoupon: generallyAllowPurchase,
		specialCoupon: allowPurchaseWithSpecialCoupon,
	}

	const allowPurchase =
		generallyAllowPurchase || Object.values(allowPurchaseWith).some(Boolean)

	const isRestrictedUpgrade =
		purchaseToUpgrade?.status === 'Restricted' &&
		appliedMerchantCoupon &&
		appliedMerchantCoupon.type !== 'ppp'

	type AvailableCoupon = NonNullable<
		typeof formattedPrice
	>['availableCoupons'][0]

	function getFirstPPPCoupon<
		T extends { type: string | null | undefined } = any,
	>(availableCoupons: T[] = []) {
		return find<T>(availableCoupons, (coupon) => coupon?.type === 'ppp') || null
	}

	const availablePPPCoupon = formattedPrice?.availableCoupons.find(
		(coupon) => coupon?.type === 'ppp',
	)

	const appliedPPPCoupon =
		appliedMerchantCoupon?.type === 'ppp' ? appliedMerchantCoupon : null

	// if there is no available coupon, hide the box (it's not a toggle)
	// only show the box if ppp coupon is available
	// do not show the box if purchased
	// do not show the box if it's a downgrade
	const showPPPBox =
		isPPPEnabled &&
		Boolean(availablePPPCoupon || appliedPPPCoupon) &&
		!purchased &&
		!isDowngrade(formattedPrice) &&
		!isBuyingForTeam &&
		allowPurchaseWith?.pppCoupon

	const pathname = usePathname()

	const handleOnSubscribeSuccess = (subscriber: any, email?: string) => {
		if (subscriber) {
			const redirectUrl = redirectUrlBuilder(subscriber, pathname, {
				confirmToast: 'true',
			})
			// email && setUserId(email) // amplitude
			// track('subscribed to email list', {
			// 	location: 'pricing',
			// })
			router.push(redirectUrl)
		}
	}
	//
	// const workshops = modules?.filter(
	// 	(module) => module.moduleType === 'workshop',
	// )
	// const moduleBonuses = modules?.filter(
	// 	(module) => module.moduleType === 'bonus' && module.state === 'published',
	// )
	//
	function getUnitPrice(formattedPrice: FormattedPrice) {
		const price = first(formattedPrice?.upgradedProduct?.prices)
		return Number(price?.unitAmount || 0)
	}

	const fixedDiscount = formattedPrice?.fixedDiscountForUpgrade || 0

	const [isBuyingMoreSeats, setIsBuyingMoreSeats] = React.useState(false)

	const [mounted, setMounted] = React.useState(false)
	React.useEffect(() => {
		setMounted(true)
	}, [])

	const isSoldOut =
		product.fields.type === 'live' && !purchased && quantityAvailable <= 0

	const isSellingLive = true
	return (
		<div id={id}>
			<div data-pricing-product={index}>
				{/*{withImage && image && (*/}
				{/*	<div data-pricing-product-image="">*/}
				{/*		<Image*/}
				{/*			priority*/}
				{/*			src={image.url}*/}
				{/*			alt={image.alt}*/}
				{/*			quality={100}*/}
				{/*			layout={'fill'}*/}
				{/*			objectFit="contain"*/}
				{/*			aria-hidden="true"*/}
				{/*		/>*/}
				{/*	</div>*/}
				{/*)}*/}

				<article>
					{(isSellingLive || allowPurchase) && !purchased ? (
						<div data-pricing-product-header="">
							{product.fields.type === 'live' && quantityAvailable! <= -1 && (
								<div
									data-quantity-available={
										isSoldOut ? 'sold-out' : quantityAvailable
									}
								>
									{isSoldOut ? 'Sold out' : `${quantityAvailable} spots left.`}
								</div>
							)}
							<p data-name-badge="">{name}</p>
							{title && (
								<h2 data-title>
									<Balancer>{title}</Balancer>
								</h2>
							)}
							{isSoldOut ? (
								// <SubscribeForm
								// 	fields={{
								// 		[`interested_${snakeCase(product?.slug)}`.toLowerCase()]:
								// 			new Date().toISOString().slice(0, 10),
								// 	}}
								// 	description="Join the waitlist to get notified when this or similar event gets scheduled."
								// 	handleOnSubscribeSuccess={handleOnSubscribeSuccess}
								// 	actionLabel="Join waitlist"
								// />
								<div>Subscribe</div>
							) : (
								<>
									<PriceDisplay
										status={'success'}
										formattedPrice={formattedPrice}
									/>
									{isRestrictedUpgrade ? (
										<div data-byline="">All region access</div>
									) : (
										<div data-byline="">
											{appliedMerchantCoupon?.type === 'ppp'
												? 'Regional access'
												: formattedPrice?.upgradeFromPurchaseId
													? `Upgrade Pricing`
													: 'Full access'}
										</div>
									)}
									{formattedPrice?.upgradeFromPurchaseId &&
										!isRestrictedUpgrade &&
										fixedDiscount > 0 && (
											<div data-byline="">
												{`${formatUsd(fixedDiscount).dollars}.${
													formatUsd(fixedDiscount).cents
												} credit applied`}
											</div>
										)}
								</>
							)}
						</div>
					) : null}
					{options.saleCountdownRenderer
						? options.saleCountdownRenderer({
								coupon: defaultCoupon
									? Number(couponFromCode?.percentageDiscount) >=
										Number(defaultCoupon?.percentageDiscount)
										? couponFromCode
										: defaultCoupon
									: couponFromCode,
							})
						: null}
					{purchased ? (
						<Suspense>
							<div data-pricing-product-header="">
								<p data-name-badge="">{name}</p>
								{title && (
									<h2 data-title>
										<Balancer>{title}</Balancer>
									</h2>
								)}
							</div>
							<div data-purchased-container="">
								<div data-purchased="">
									<CheckCircleIcon aria-hidden="true" /> Purchased
								</div>
								<div
									data-buy-more-seats={
										isBuyingMoreSeats ? 'active' : 'inactive'
									}
								>
									<button
										type="button"
										onClick={() => {
											setIsBuyingMoreSeats(!isBuyingMoreSeats)
										}}
									>
										{isBuyingMoreSeats ? '← Back' : 'Buy more seats'}
									</button>
									<AnimatePresence>
										{isBuyingMoreSeats && (
											<motion.div
												initial={{ x: '100%', opacity: 0 }}
												animate={{ x: '0%', opacity: 1 }}
												exit={{ x: '-100%', opacity: 0 }}
												transition={{}}
											>
												<BuyMoreSeats
													productId={productId}
													userId={userId as string}
													buttonLabel="Buy more seats"
													pricingDataLoader={pricingDataLoader}
												/>
											</motion.div>
										)}
									</AnimatePresence>
								</div>
							</div>
						</Suspense>
					) : isSellingLive || allowPurchase ? (
						isDowngrade(formattedPrice) ? (
							<div data-downgrade-container="">
								<div data-downgrade="">Unavailable</div>
							</div>
						) : isSoldOut ? null : (
							<div data-purchase-container="">
								<form
									action={buildStripeCheckoutPath({
										productId: formattedPrice?.id,
										couponId: appliedMerchantCoupon?.id,
										bulk: isBuyingForTeam,
										quantity,
										userId,
										upgradeFromPurchaseId:
											formattedPrice?.upgradeFromPurchaseId,
										cancelUrl,
										usedCouponId: formattedPrice?.usedCouponId,
									})}
									method="POST"
								>
									<fieldset>
										<legend className="sr-only">{name}</legend>
										<div data-team-switch="">
											<label htmlFor="team-switch">
												Buying for myself or for my team
											</label>
											<button
												role="button"
												type="button"
												onClick={() => {
													setIsBuyingForTeam(false)
													setQuantity(1)
												}}
											>
												For myself
											</button>
											<Switch.Root
												aria-label={
													isBuyingForTeam ? 'For my team' : 'For myself'
												}
												onCheckedChange={() => {
													setIsBuyingForTeam(!isBuyingForTeam)
													isBuyingForTeam ? setQuantity(1) : setQuantity(5)
												}}
												checked={isBuyingForTeam}
												id="team-switch"
											>
												<Switch.Thumb />
											</Switch.Root>
											<button
												role="button"
												type="button"
												onClick={() => {
													setIsBuyingForTeam(true)
													setQuantity(5)
												}}
											>
												For my team
											</button>
										</div>
										{isBuyingForTeam && (
											<div data-quantity-input="">
												<div>
													<label>Team Seats</label>
													<button
														type="button"
														aria-label="decrease seat quantity by one"
														onClick={() => {
															if (quantity === 1) return
															setQuantity(quantity - 1)
														}}
													>
														-
													</button>
													<input
														type="number"
														min={1}
														max={teamQuantityLimit}
														step={1}
														onChange={(e) => {
															const quantity = Number(e.target.value)
															setMerchantCoupon(undefined)
															setQuantity(
																quantity < 1
																	? 1
																	: teamQuantityLimit &&
																		  quantity > teamQuantityLimit
																		? teamQuantityLimit
																		: quantity,
															)
														}}
														onKeyDown={(e) => {
															// don't allow decimal
															if (e.key === ',') {
																e.preventDefault()
															}
														}}
														inputMode="numeric"
														pattern="[0-9]*"
														value={quantity}
														id={`${quantity}-${name}`}
														required={true}
													/>
													<button
														type="button"
														aria-label="increase seat quantity by one"
														onClick={() => {
															if (quantity === 100) return
															setQuantity(quantity + 1)
														}}
													>
														+
													</button>
												</div>
											</div>
										)}

										{purchaseButtonRenderer(formattedPrice, product, 'success')}
										{withGuaranteeBadge && (
											<span data-guarantee="">30-Day Money-Back Guarantee</span>
										)}
										{isLiveEvent && (
											<span data-live-event="">
												<Balancer>
													Tickets to live events are non-refundable, but can be
													transferred
												</Balancer>
											</span>
										)}
									</fieldset>
								</form>
							</div>
						)
					) : (
						<div data-purchased-container="">
							<div data-unavailable="">Coming Soon</div>
							<div
								data-description=""
								className="my-6 items-center text-base font-medium leading-tight"
							>
								{process.env.NEXT_PUBLIC_SITE_TITLE} is not available for
								purchase yet! We plan to launch in mid October 2023.
							</div>
							{/*{!subscriber && !loadingSubscriber && (*/}
							{/*	<SubscribeForm*/}
							{/*		handleOnSubscribeSuccess={handleOnSubscribeSuccess}*/}
							{/*	/>*/}
							{/*)}*/}
						</div>
					)}
					{/*{!options.saleCountdownRenderer && (*/}
					{/*	<>*/}
					{/*		{(isSellingLive || allowPurchase) && !purchased && (*/}
					{/*			<SaleCountdown*/}
					{/*				coupon={*/}
					{/*					defaultCoupon*/}
					{/*						? Number(couponFromCode?.percentageDiscount) >=*/}
					{/*							Number(defaultCoupon?.percentageDiscount)*/}
					{/*							? couponFromCode*/}
					{/*							: defaultCoupon*/}
					{/*						: couponFromCode*/}
					{/*				}*/}
					{/*				data-pricing-product-sale-countdown={index}*/}
					{/*			/>*/}
					{/*		)}*/}
					{/*	</>*/}
					{/*)}*/}
					{/*{showPPPBox &&*/}
					{/*	!canViewRegionRestriction &&*/}
					{/*	(isSellingLive || allowPurchase) && (*/}
					{/*		<RegionalPricingBox*/}
					{/*			availablePPPCoupon={availablePPPCoupon}*/}
					{/*			appliedPPPCoupon={appliedPPPCoupon}*/}
					{/*			setMerchantCoupon={setMerchantCoupon}*/}
					{/*			index={index}*/}
					{/*			setAutoApplyPPP={setAutoApplyPPP}*/}
					{/*			purchaseToUpgradeExists={Boolean(purchaseToUpgrade)}*/}
					{/*		/>*/}
					{/*	)}*/}
					<div data-pricing-footer="">
						{product.fields.description &&
							(isSellingLive || allowPurchase) &&
							!purchased && (
								<div
									data-product-description=""
									className="prose prose-sm sm:prose-base prose-p:text-gray-200 mx-auto max-w-sm px-5"
								>
									<ReactMarkdown>{product.fields.description}</ReactMarkdown>
								</div>
							)}
					</div>
				</article>
			</div>
		</div>
	)
}

export type PriceDisplayProps = {
	status: QueryStatus
	formattedPrice?: FormattedPrice | null
	className?: string
}

export const PriceDisplay = ({
	status,
	formattedPrice,
	className = '',
}: PriceDisplayProps) => {
	const { isDiscount } = usePriceCheck()

	const appliedMerchantCoupon = formattedPrice?.appliedMerchantCoupon

	const fullPrice = formattedPrice?.fullPrice

	const percentOff = appliedMerchantCoupon
		? Math.floor(+appliedMerchantCoupon.percentageDiscount * 100)
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
		<div data-price-container={status} className={className}>
			{status === 'pending' ? (
				<div data-loading-price="">
					<span className="sr-only">Loading price</span>
					<Spinner aria-hidden="true" className="h-8 w-8" />
				</div>
			) : (
				<>
					<sup aria-hidden="true">US</sup>
					<div aria-live="polite" data-price="">
						{formattedPrice?.calculatedPrice &&
							formatUsd(formattedPrice?.calculatedPrice).dollars}
						<span className="sup text-sm" aria-hidden="true">
							{formattedPrice?.calculatedPrice &&
								formatUsd(formattedPrice?.calculatedPrice).cents}
						</span>
						{Boolean(appliedMerchantCoupon || isDiscount(formattedPrice)) && (
							<>
								<div aria-hidden="true" data-price-discounted="">
									<div data-full-price={fullPrice}>{'$' + fullPrice}</div>
									<div data-percent-off={percentOff}>Save {percentOff}%</div>
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
	)
}

const Spinner: React.FunctionComponent<{
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
// pricingDataLoader: Promise<PricingData>
const buyMoreSeatsSchema = z.object({
	productId: z.string(),
	userId: z.string(),
	buttonLabel: z.string().default('Buy').nullish(),
	className: z.string().optional(),
})
type BuyMoreSeatsProps = z.infer<typeof buyMoreSeatsSchema> & {
	pricingDataLoader: Promise<PricingData>
}

const BuyMoreSeats = ({
	productId,
	userId,
	buttonLabel = 'Buy',
	className = '',
	pricingDataLoader,
}: BuyMoreSeatsProps) => {
	const [quantity, setQuantity] = React.useState(5)
	const debouncedQuantity: number = useDebounce<number>(quantity, 250)

	// const { data: formattedPrice, status } =
	// 	trpcSkillLessons.pricing.formatted.useQuery({
	// 		productId,
	// 		quantity: debouncedQuantity,
	// 	})

	const { formattedPrice } = use(pricingDataLoader)

	const formActionPath = buildStripeCheckoutPath({
		userId,
		quantity: debouncedQuantity,
		productId,
		bulk: Boolean(formattedPrice?.bulk),
		couponId: formattedPrice?.appliedMerchantCoupon?.id,
	})

	return (
		<form
			data-buy-more-seats-form=""
			action={formActionPath}
			method="POST"
			className={className}
		>
			<fieldset id="team-upgrade-pricing-inline">
				<div data-seats-form="">
					<label>Seats</label>
					<button
						type="button"
						aria-label="decrease seat quantity by one"
						onClick={() => {
							if (quantity === 1) return
							setQuantity(quantity - 1)
						}}
					>
						-
					</button>
					<input
						value={quantity}
						required={true}
						type="number"
						min={1}
						max={100}
						step={1}
						onChange={(e) => {
							const newQuantity = Number(e.target.value)
							setQuantity(newQuantity)
						}}
					/>
					<button
						type="button"
						aria-label="increase seat quantity by one"
						onClick={() => {
							if (quantity === 100) return
							setQuantity(quantity + 1)
						}}
					>
						+
					</button>
				</div>
				<div data-pricing-product="">
					<div data-pricing-product-header="">
						<PriceDisplay status={'success'} formattedPrice={formattedPrice} />
						<button type="submit" disabled={false}>
							{buttonLabel}
						</button>
					</div>
				</div>
			</fieldset>
		</form>
	)
}
