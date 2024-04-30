import * as React from 'react'
import { Suspense, use } from 'react'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { buildStripeCheckoutPath } from '@/path-to-purchase/build-stripe-checkout-path'
import { BuyMoreSeats } from '@/pricing/buy-more-seats'
import { formatUsd } from '@/pricing/format-usd'
import { PriceDisplay } from '@/pricing/price-display'
import { usePriceCheck } from '@/pricing/pricing-check-context'
import { PricingProps } from '@/pricing/pricing-props'
import { redirectUrlBuilder } from '@/pricing/redirect-url-builder'
import { useDebounce } from '@/pricing/use-debounce'
import { api } from '@/trpc/react'
import * as Switch from '@radix-ui/react-switch'
import { AnimatePresence, motion } from 'framer-motion'
import { find, first } from 'lodash'
import { CheckCircleIcon } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import Balancer from 'react-wrap-balancer'

import { FormattedPrice } from '@coursebuilder/core/types'

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
		allowTeamPurchase: true,
	},
}) => {
	const {
		withImage = true,
		isPPPEnabled = true,
		withGuaranteeBadge = true,
		isLiveEvent = false,
		teamQuantityLimit = 100,
		allowTeamPurchase = true,
	} = options
	const {
		addPrice,
		isDowngrade,
		merchantCoupon,
		setMerchantCoupon,
		quantity,
		setQuantity,
	} = usePriceCheck()

	console.log({ purchased })

	const [isBuyingForTeam, setIsBuyingForTeam] = React.useState(false)
	const debouncedQuantity: number = useDebounce<number>(quantity, 250)
	const { id: productId, name, resources, fields } = product
	const { image, action } = fields
	// const { subscriber, loadingSubscriber } = useConvertkit()
	const router = useRouter()
	const [autoApplyPPP, setAutoApplyPPP] = React.useState<boolean>(true)

	const { purchaseToUpgrade, quantityAvailable } = use(pricingDataLoader)

	const { data: formattedPrice, status } = api.pricing.formatted.useQuery({
		productId,
		quantity: debouncedQuantity,
		couponId,
		merchantCoupon,
		autoApplyPPP,
	})

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

	const workshops = resources?.filter(
		(module) => module.resource.type === 'workshop',
	)
	const moduleBonuses = resources?.filter(
		(module) =>
			module.resource.type === 'bonus' &&
			module.resource.fields.state === 'published',
	)

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
		product.type === 'live' && !purchased && quantityAvailable <= 0

	const isSellingLive = true
	return (
		<div id={id}>
			<div data-pricing-product={index}>
				{withImage && image && (
					<div data-pricing-product-image="">
						<Image
							priority
							src={image.url}
							alt={image.alt || name}
							quality={100}
							layout={'fill'}
							objectFit="contain"
							aria-hidden="true"
						/>
					</div>
				)}

				<article>
					{(isSellingLive || allowPurchase) && !purchased ? (
						<div data-pricing-product-header="">
							{product.type === 'live' && quantityAvailable! <= -1 && (
								<div
									data-quantity-available={
										isSoldOut ? 'sold-out' : quantityAvailable
									}
								>
									{isSoldOut ? 'Sold out' : `${quantityAvailable} spots left.`}
								</div>
							)}
							<p data-name-badge="">{name}</p>
							{product.name && (
								<h2 data-title>
									<Balancer>{product.name}</Balancer>
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
										status={status}
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
								{product.name && (
									<h2 data-title>
										<Balancer>{product.name}</Balancer>
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
										{allowTeamPurchase && (
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
										)}
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
									className="prose prose-sm sm:prose-base prose-p:text-gray-900 mx-auto max-w-sm px-5"
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
