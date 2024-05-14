import * as React from 'react'
import { Suspense, use } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation.js'
import * as Switch from '@radix-ui/react-switch'
import { useQuery } from '@tanstack/react-query'
import { AnimatePresence, motion } from 'framer-motion'
import { find, first } from 'lodash'
import { CheckCircleIcon } from 'lucide-react'
import pluralize from 'pluralize'
import ReactMarkdown from 'react-markdown'
import Balancer from 'react-wrap-balancer'

import { ContentResourceProduct } from '@coursebuilder/core/schemas/content-resource-schema'
import {
	ContentResource,
	ContentResourceResource,
	FormattedPrice,
} from '@coursebuilder/core/types'

import { BuyMoreSeats } from '../post-purchase/buy-more-seats'
import { buildStripeCheckoutPath } from '../utils/build-stripe-checkout-path'
import { formatUsd } from '../utils/format-usd'
import { redirectUrlBuilder } from '../utils/redirect-url-builder'
import { useDebounce } from '../utils/use-debounce'
import { PriceDisplay } from './price-display'
import { usePriceCheck } from './pricing-check-context'
import { PricingProps } from './pricing-props'
import { RegionalPricingBox } from './regional-pricing-box'

const defaultPricingOptions = {
	withImage: true,
	isPPPEnabled: true,
	withGuaranteeBadge: true,
	isLiveEvent: false,
	saleCountdownRenderer: () => null,
	teamQuantityLimit: 100,
	allowTeamPurchase: true,
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
	options = defaultPricingOptions,
}) => {
	const {
		withImage = true,
		isPPPEnabled = true,
		withGuaranteeBadge = true,
		isLiveEvent = false,
		teamQuantityLimit = 100,
		allowTeamPurchase = true,
	} = { ...defaultPricingOptions, ...options }
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
	const { id: productId, name, resources, fields } = product
	const { image, action } = fields
	// const { subscriber, loadingSubscriber } = useConvertkit()
	const router = useRouter()
	const [autoApplyPPP, setAutoApplyPPP] = React.useState<boolean>(true)

	const { purchaseToUpgrade, quantityAvailable } = use(pricingDataLoader)

	const { data: formattedPrice, status } = useQuery({
		queryKey: [
			'prices-formatted',
			productId,
			debouncedQuantity,
			isBuyingForTeam,
		],
		queryFn: async () => {
			return await fetch(
				`${process.env.NEXT_PUBLIC_URL}/api/coursebuilder/prices-formatted`,
				{
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
					},
					body: JSON.stringify({
						productId,
						quantity: debouncedQuantity,
						couponId,
						merchantCoupon,
						autoApplyPPP,
					}),
				},
			).then(async (res) => {
				return ((await res.json()) as FormattedPrice) || null
			})
		},
	})

	const defaultCoupon = formattedPrice?.defaultCoupon
	const appliedMerchantCoupon = formattedPrice?.appliedMerchantCoupon

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

	const workshops: ContentResourceProduct[] =
		resources?.filter((module) =>
			['workshop', 'tutorial'].includes(module.resource.type),
		) ?? []

	const moduleBonuses =
		resources?.filter(
			(module) =>
				module.resource.type === 'bonus' &&
				module.resource.fields.state === 'published',
		) ?? []

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
							{product.type === 'live' && quantityAvailable != -1 && (
								<div
									data-quantity-available={
										isSoldOut ? 'sold-out' : quantityAvailable
									}
								>
									{isSoldOut ? 'Sold out' : `${quantityAvailable} spots left`}
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
												Tickets to live events are non-refundable, but can be
												transferred
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
					{showPPPBox &&
						!canViewRegionRestriction &&
						(isSellingLive || allowPurchase) && (
							<RegionalPricingBox
								availablePPPCoupon={availablePPPCoupon}
								appliedPPPCoupon={appliedPPPCoupon}
								setMerchantCoupon={setMerchantCoupon}
								index={index}
								setAutoApplyPPP={setAutoApplyPPP}
								purchaseToUpgradeExists={Boolean(purchaseToUpgrade)}
							/>
						)}
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
						{(isSellingLive || allowPurchase) &&
							!purchased &&
							withGuaranteeBadge && (
								<div data-guarantee-image="">
									<Image
										src="https://res.cloudinary.com/total-typescript/image/upload/v1669928567/money-back-guarantee-badge-16137430586cd8f5ec2a096bb1b1e4cf_o5teov.svg"
										width={130}
										height={130}
										alt="Money Back Guarantee"
									/>
								</div>
							)}
						{/*{modules || features ? (*/}
						{/*	<div data-header="">*/}
						{/*		<div>*/}
						{/*			<span>includes</span>*/}
						{/*		</div>*/}
						{/*	</div>*/}
						{/*) : null}*/}
						<div data-main="">
							{/*{bonuses &&*/}
							{/*	bonuses.length > 0 &&*/}
							{/*	bonuses[0].expiresAt &&*/}
							{/*	quantity === 1 &&*/}
							{/*	!Boolean(merchantCoupon?.type === 'ppp') && (*/}
							{/*		<Countdown*/}
							{/*			date={bonuses[0].expiresAt}*/}
							{/*			renderer={({*/}
							{/*				days,*/}
							{/*				hours,*/}
							{/*				minutes,*/}
							{/*				seconds,*/}
							{/*				completed,*/}
							{/*			}) => {*/}
							{/*				return completed ? null : (*/}
							{/*					<>*/}
							{/*						<div data-limited-bonuses="">*/}
							{/*							<strong>limited offer</strong>*/}
							{/*							<ul role="list">*/}
							{/*								{bonuses.map((bonus) => {*/}
							{/*									return (*/}
							{/*										<li key={bonus.slug}>*/}
							{/*											<LimitedBonusItem*/}
							{/*												module={bonus as any}*/}
							{/*												key={bonus.slug}*/}
							{/*											/>*/}
							{/*										</li>*/}
							{/*									)*/}
							{/*								})}*/}
							{/*								<div data-expires-at="">*/}
							{/*									{mounted ? (*/}
							{/*										<span>*/}
							{/*											expires in: {days}d : {hours}h : {minutes}m*/}
							{/*											: {seconds}s*/}
							{/*										</span>*/}
							{/*									) : null}*/}
							{/*								</div>*/}
							{/*								<div data-disclaimer="">*/}
							{/*									Offer available for new purchases only. If*/}
							{/*									you've already purchased both of the courses*/}
							{/*									this offer does not apply. If you've purchased 1*/}
							{/*									of the courses, you'll receive the other.*/}
							{/*								</div>*/}
							{/*							</ul>*/}
							{/*						</div>*/}
							{/*					</>*/}
							{/*				)*/}
							{/*			}}*/}
							{/*		/>*/}
							{/*	)}*/}
							{moduleBonuses &&
								moduleBonuses.length > 0 &&
								!Boolean(merchantCoupon) && (
									<div data-bonuses="">
										<ul role="list">
											{moduleBonuses.map((module) => {
												return purchased ? (
													<li key={module.resource.fields.slug}>
														<Link
															href={{
																pathname: `/bonuses/[slug]`,
																query: {
																	slug: module.resource.fields.slug,
																},
															}}
														>
															<WorkshopListItem module={module} />
														</Link>
													</li>
												) : (
													<li key={module.resource.fields.slug}>
														<WorkshopListItem
															module={module}
															key={module.resource.fields.slug}
														/>
													</li>
												)
											})}
										</ul>
									</div>
								)}
							{workshops && (
								<div data-workshops="">
									<strong>Workshops</strong>
									<ul role="list">
										{workshops.map((module) => {
											return purchased ? (
												<li key={module.resource.fields.slug}>
													<Link
														href={`/${pluralize(module.resource.type)}/${module.resource.fields.slug}`}
													>
														<WorkshopListItem module={module} />
													</Link>
												</li>
											) : (
												<li key={module.resource.fields.slug}>
													<WorkshopListItem
														module={module}
														key={module.resource.fields.slug}
													/>
												</li>
											)
										})}
									</ul>
								</div>
							)}

							{/*{features && (*/}
							{/*	<div data-features="">*/}
							{/*		<strong>Features</strong>*/}
							{/*		<ul role="list">*/}
							{/*			{features.map((feature: {value: string; icon?: string}) => (*/}
							{/*				<li key={feature.value}>*/}
							{/*					{feature.icon && (*/}
							{/*						<span*/}
							{/*							dangerouslySetInnerHTML={{__html: feature.icon}}*/}
							{/*						/>*/}
							{/*					)}*/}
							{/*					<p>{feature.value}</p>*/}
							{/*				</li>*/}
							{/*			))}*/}
							{/*		</ul>*/}
							{/*	</div>*/}
							{/*)}*/}
							{/*{product.fields.slug && lessons && (*/}
							{/*	<div data-contents="">*/}
							{/*		{lessons ? `${lessons?.length} lessons` : null}*/}
							{/*		<Link href={`/workshops/${product.slug}`}>*/}
							{/*			View contents <span aria-hidden="true">→</span>*/}
							{/*		</Link>*/}
							{/*	</div>*/}
							{/*)}*/}
						</div>
					</div>
				</article>
			</div>
		</div>
	)
}

const LimitedBonusItem: React.FC<{
	module: {
		image?: {
			url: string
		}
		expiresAt?: string
		title: string
		description?: string
	}
}> = ({ module }) => {
	return (
		<>
			{module.image && (
				<div data-image="" aria-hidden="true">
					<Image
						src={module.image.url}
						layout="fill"
						alt={module.title}
						aria-hidden="true"
					/>
				</div>
			)}
			<div>
				<p>{module.title}</p>
				{module?.description && (
					<div data-description="">
						<ReactMarkdown
							components={{
								a: (props) => <a {...props} target="_blank" rel="noopener" />,
							}}
						>
							{module.description}
						</ReactMarkdown>
					</div>
				)}
			</div>
		</>
	)
}

const WorkshopListItem: React.FC<{
	module: ContentResourceProduct
}> = ({ module }) => {
	const getLabelForState = (state: any) => {
		switch (state) {
			case 'draft':
				return 'Coming soon'
			default:
				return ''
		}
	}
	return (
		<>
			{module.resource.fields.image?.url && (
				<div data-image="" aria-hidden="true">
					<Image
						src={module.resource.fields.image.url}
						layout="fill"
						alt={module.resource.fields.title}
						aria-hidden="true"
					/>
				</div>
			)}
			<div>
				<p>
					{module.resource.fields.moduleType === 'bonus' && (
						<strong>Bonus</strong>
					)}

					{module.resource.fields.title}
				</p>
				{module.resource.fields.state && (
					<div data-state={module.resource.fields.state}>
						{getLabelForState(module.resource.fields.state)}
					</div>
				)}
				{module.resource.fields?.description && (
					<div data-description="">
						<ReactMarkdown
							components={{
								a: (props) => <a {...props} target="_blank" rel="noopener" />,
							}}
						>
							{module.resource.fields.description}
						</ReactMarkdown>
					</div>
				)}
			</div>
		</>
	)
}
