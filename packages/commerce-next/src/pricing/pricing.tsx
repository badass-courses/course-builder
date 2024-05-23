import * as React from 'react'
import { Suspense, use } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation.js'
import { Slot } from '@radix-ui/react-slot'
import * as Switch from '@radix-ui/react-switch'
import { useMachine } from '@xstate/react'
import { AnimatePresence, motion } from 'framer-motion'
import { find, first } from 'lodash'
import { CheckCircleIcon } from 'lucide-react'
import pluralize from 'pluralize'
import ReactMarkdown from 'react-markdown'
import Balancer from 'react-wrap-balancer'

import { MerchantCoupon, Product } from '@coursebuilder/core/schemas'
import { ContentResourceProduct } from '@coursebuilder/core/schemas/content-resource-schema'
import { FormattedPrice } from '@coursebuilder/core/types'
import { cn } from '@coursebuilder/ui/utils/cn'

import { BuyMoreSeats } from '../post-purchase/buy-more-seats'
import { buildStripeCheckoutPath } from '../utils/build-stripe-checkout-path'
import { formatUsd } from '../utils/format-usd'
import { redirectUrlBuilder } from '../utils/redirect-url-builder'
import { PriceDisplay } from './price-display'
import { usePriceCheck } from './pricing-check-context'
import { PricingOptions, PricingProps } from './pricing-props'
import {
	PricingContextType,
	pricingMachine,
	PricingMachineInput,
} from './pricing-state-machine'
import { RegionalPricingBox } from './regional-pricing-box'

const PricingContext = React.createContext<
	| (PricingContextType & {
			status: 'success' | 'pending' | 'error'
			toggleBuyingMoreSeats: () => void
			toggleTeamPurchase: () => void
			updateQuantity: (quantity: number) => void
			setMerchantCoupon: (merchantCoupon: MerchantCoupon | undefined) => void
	  })
	| undefined
>(undefined)

export const PricingProvider = ({
	children,
	...props
}: PricingMachineInput & {
	children: React.ReactNode
}) => {
	const [state, send] = useMachine(pricingMachine, {
		input: props,
	})

	const toggleBuyingMoreSeats = () => {
		send({
			type: 'TOGGLE_BUYING_MORE_SEATS',
		})
	}
	const toggleTeamPurchase = () => {
		send({
			type: 'TOGGLE_TEAM_PURCHASE',
		})
	}
	const updateQuantity = (quantity: number) => {
		send({
			type: 'UPDATE_QUANTITY',
			quantity,
		})
	}
	const setMerchantCoupon = (merchantCoupon: MerchantCoupon | undefined) => {
		send({
			type: 'SET_MERCHANT_COUPON',
			merchantCoupon,
		})
	}

	return (
		<PricingContext.Provider
			value={{
				...state.context,
				status: state.value === 'Ready To Buy' ? 'success' : 'pending',
				toggleBuyingMoreSeats,
				toggleTeamPurchase,
				updateQuantity,
				setMerchantCoupon,
			}}
		>
			{children}
		</PricingContext.Provider>
	)
}

const usePricing = () => {
	const context = React.use(PricingContext)
	if (!context) {
		throw new Error('usePricing must be used within a PricingProvider')
	}
	return context
}

type RootProps = {
	className?: string
	asChild?: boolean
	product: Product
	couponId?: string | null | undefined
	country?: string
	options?: PricingOptions
}

const Root = ({
	children,
	asChild,
	className,
	...props
}: RootProps & { children: React.ReactNode }) => {
	const Comp = asChild ? Slot : 'div'

	return (
		<PricingProvider {...props}>
			<Comp
				className={cn(
					'mx-auto flex w-full max-w-screen-lg flex-wrap items-start justify-center gap-5',
					className,
				)}
			>
				{children}
			</Comp>
		</PricingProvider>
	)
}

const PricingProduct = ({
	children,
	className,
}: {
	children: React.ReactNode
	className?: string
}) => {
	const { product } = usePricing()
	return <div className={cn('', className)}>{children}</div>
}

const Details = ({
	children,
	className,
}: {
	children: React.ReactNode
	className?: string
}) => {
	const { product } = usePricing()
	return (
		<article
			className={cn(
				'bg-card shadow-gray-500/10; rounded-lg border pt-36 shadow-2xl',
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
	const { product } = usePricing()
	return (
		<div
			className={cn(
				'bg-background dark:border-border dark:bg-background relative mx-auto -mb-32 h-56 w-56 rounded-full border border-gray-200 drop-shadow-xl',
				className,
			)}
		>
			{children ||
				(product.fields.image && (
					<Image
						className="overflow-hidden rounded-full"
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
	)
}

const Name = ({
	className,
	children,
}: {
	className?: string
	children?: React.ReactNode
}) => {
	const { product } = usePricing()
	return (
		<div
			className={cn(
				'px-5 text-center text-xl font-black sm:text-2xl',
				className,
			)}
		>
			<Balancer>{children || product.name}</Balancer>
		</div>
	)
}

const Price = ({
	className,
	children,
}: {
	className?: string
	children?: React.ReactNode
}) => {
	const { formattedPrice, status } = usePricing()
	return (
		<>
			{children || (
				<PriceDisplay status={status} formattedPrice={formattedPrice} />
			)}
		</>
	)
}

export { Root, PricingProduct as Product, ProductImage, Name, Details, Price }

export const Pricing: React.FC<React.PropsWithChildren<PricingProps>> = ({
	pricingDataLoader,
	product,
	purchased = false,
	userId,
	index = 0,
	couponFromCode,
	couponId,
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
	options: incomingOptions,
}) => {
	const pathname = usePathname()
	const router = useRouter()
	const { purchaseToUpgrade, quantityAvailable } = use(pricingDataLoader)
	const { isDowngrade } = usePriceCheck()

	const [state, send] = useMachine(pricingMachine, {
		input: {
			product,
			couponId,
			options: incomingOptions,
		},
	})

	const { formattedPrice, quantity, autoApplyPPP, isBuyingMoreSeats, options } =
		state.context

	const {
		withImage,
		isPPPEnabled,
		withGuaranteeBadge,
		isLiveEvent,
		teamQuantityLimit,
		allowTeamPurchase,
	} = options

	const merchantCoupon = state.context.activeMerchantCoupon

	const { id: productId, name, resources, fields } = product
	const { image } = fields
	// const { subscriber, loadingSubscriber } = useConvertkit()

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
		!state.context.isTeamPurchaseActive &&
		allowPurchaseWith?.pppCoupon

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

	const isSoldOut =
		product.type === 'live' && !purchased && quantityAvailable <= 0

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
					{allowPurchase && !purchased ? (
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
								<h2 data-title="">
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
										status={
											state.value === 'Ready To Buy' ? 'success' : 'pending'
										}
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
									<h2 data-title="">
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
											send({
												type: 'TOGGLE_BUYING_MORE_SEATS',
											})
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
					) : allowPurchase ? (
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
										bulk: state.context.isTeamPurchaseActive,
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
														send({
															type: 'TOGGLE_TEAM_PURCHASE',
														})
													}}
												>
													For myself
												</button>
												<Switch.Root
													aria-label={
														state.context.isTeamPurchaseActive
															? 'For my team'
															: 'For myself'
													}
													onCheckedChange={() => {
														send({
															type: 'TOGGLE_TEAM_PURCHASE',
														})
													}}
													checked={state.context.isTeamPurchaseActive}
													id="team-switch"
												>
													<Switch.Thumb />
												</Switch.Root>
												<button
													role="button"
													type="button"
													onClick={() => {
														send({
															type: 'TOGGLE_TEAM_PURCHASE',
														})
													}}
												>
													For my team
												</button>
											</div>
										)}
										{state.context.isTeamPurchaseActive && (
											<div data-quantity-input="">
												<div>
													<label>Team Seats</label>
													<button
														type="button"
														aria-label="decrease seat quantity by one"
														onClick={() => {
															if (quantity === 1) return
															send({
																type: 'UPDATE_QUANTITY',
																quantity: quantity - 1,
															})
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
															const newQuantity =
																quantity < 1
																	? 1
																	: teamQuantityLimit &&
																		  quantity > teamQuantityLimit
																		? teamQuantityLimit
																		: quantity
															send({
																type: 'SET_MERCHANT_COUPON',
																merchantCoupon: undefined,
															})
															send({
																type: 'UPDATE_QUANTITY',
																quantity: newQuantity,
															})
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
															send({
																type: 'UPDATE_QUANTITY',
																quantity: quantity + 1,
															})
														}}
													>
														+
													</button>
												</div>
											</div>
										)}

										{purchaseButtonRenderer(
											formattedPrice,
											product,
											state.value === 'Ready To Buy' ? 'success' : 'pending',
										)}
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
								purchase yet!
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
					{showPPPBox && !canViewRegionRestriction && allowPurchase && (
						<RegionalPricingBox
							availablePPPCoupon={availablePPPCoupon}
							appliedPPPCoupon={appliedPPPCoupon}
							setMerchantCoupon={(merchantCoupon: MerchantCoupon) => {
								send({
									type: 'SET_MERCHANT_COUPON',
									merchantCoupon,
								})
							}}
							index={index}
							setAutoApplyPPP={() => {}}
							purchaseToUpgradeExists={Boolean(purchaseToUpgrade)}
						/>
					)}
					<div data-pricing-footer="">
						{product.fields.description && allowPurchase && !purchased && (
							<div
								data-product-description=""
								className="prose prose-sm sm:prose-base prose-p:text-gray-900 mx-auto max-w-sm px-5"
							>
								<ReactMarkdown>{product.fields.description}</ReactMarkdown>
							</div>
						)}
						{allowPurchase && !purchased && withGuaranteeBadge && (
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
