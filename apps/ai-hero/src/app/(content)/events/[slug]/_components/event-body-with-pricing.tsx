import * as React from 'react'
import { DiscountCountdown } from '@/components/mdx/mdx-components'
import { DiscountDeadline } from '@/components/pricing/discount-deadline'
import { HasPurchased } from '@/components/pricing/has-purchased'
import { PricingInline } from '@/components/pricing/pricing-inline'
import { db } from '@/db'
import { products } from '@/db/schema'
import { compileMDX } from '@/utils/compile-mdx'
import { eq } from 'drizzle-orm'

import * as Pricing from '@coursebuilder/commerce-next/pricing/pricing'

import { type EventPageProps } from './event-page-props'

/**
 * Server component that compiles event MDX body with pricing-aware components.
 * This enables dynamic pricing display within event description content.
 *
 * Available MDX components:
 * - `<Enroll>Button Text</Enroll>` - Buy/register button
 * - `<HasDiscount fallback={<>No sale</>}>Sale content</HasDiscount>` - Conditional discount content
 * - `<DiscountCountdown />` - Countdown timer to discount expiry
 * - `<PricingInline type="original" />` or `<PricingInline type="discounted" />` - Inline price
 * - `<DiscountDeadline format="long" />` - Discount deadline date
 * - `<HasPurchased productSlug="slug">Content for owners</HasPurchased>` - Conditional purchased content
 *
 * @param props - Component configuration.
 * @param props.rawBody - The raw MDX body content to compile.
 * @param props.pricingProps - Event pricing props from the page.
 */
export async function EventBodyWithPricing({
	rawBody,
	pricingProps,
}: {
	rawBody: string
	pricingProps: EventPageProps
}) {
	const {
		event,
		product,
		hasPurchasedCurrentProduct,
		pricingDataLoader,
		purchases,
		allowPurchase,
		couponFromCode,
		userId,
		country,
		defaultCoupon,
		saleData,
	} = pricingProps

	// Get product slug to ID map for HasPurchased component
	const allProducts = await db.query.products.findMany({
		where: eq(products.status, 1),
	})
	const productMap = new Map<string, string>(
		allProducts
			.filter((p): p is typeof p & { fields: { slug: string } } =>
				Boolean(p.fields?.slug),
			)
			.map((p) => [p.fields.slug, p.id]),
	)

	// Compute discount values from defaultCoupon if saleData is not available
	const discountScope = saleData
		? { ...saleData }
		: defaultCoupon
			? {
					percentOff: defaultCoupon.percentageDiscount
						? parseFloat(
								(Number(defaultCoupon.percentageDiscount) * 100).toFixed(1),
							)
						: 0,
					discountFormatted: defaultCoupon.percentageDiscount
						? `${parseFloat((Number(defaultCoupon.percentageDiscount) * 100).toFixed(1))}%`
						: defaultCoupon.amountDiscount
							? `$${(defaultCoupon.amountDiscount / 100).toFixed(2)}`
							: '0%',
					discountType:
						(defaultCoupon.amountDiscount ?? 0) > 0 ? 'fixed' : 'percentage',
					discountValue: defaultCoupon.percentageDiscount
						? parseFloat(
								(Number(defaultCoupon.percentageDiscount) * 100).toFixed(1),
							)
						: defaultCoupon.amountDiscount
							? defaultCoupon.amountDiscount / 100
							: 0,
				}
			: {
					percentOff: 0,
					discountFormatted: '0%',
					discountType: 'percentage',
					discountValue: 0,
				}

	const { content } = await compileMDX(
		rawBody,
		{
			/**
			 * Enroll/Register button. Only shows when product exists and user hasn't purchased.
			 *
			 * @example
			 * ```mdx
			 * <Enroll>Register Now</Enroll>
			 * <Enroll /> <!-- defaults to "Register Now" -->
			 * ```
			 */
			Enroll: ({
				children = 'Register Now',
			}: {
				children?: React.ReactNode
			}) =>
				product && !hasPurchasedCurrentProduct && allowPurchase ? (
					<Pricing.Root
						{...pricingProps}
						product={product}
						country={country}
						options={{
							withTitle: false,
							withImage: false,
							cancelUrl: `${process.env.NEXT_PUBLIC_URL}/events/${event.fields?.slug || event.id}`,
						}}
						userId={userId}
						pricingDataLoader={pricingDataLoader}
						className="not-prose mt-5 items-start justify-start"
					>
						<Pricing.Product>
							<Pricing.BuyButton className="dark:bg-primary dark:hover:bg-primary/90 relative h-auto w-full cursor-pointer rounded-lg bg-blue-600 px-8 font-semibold hover:bg-blue-700 sm:h-14 sm:w-auto md:px-16">
								<span className="relative z-10">{children}</span>
								<div
									style={{
										backgroundSize: '200% 100%',
									}}
									className="animate-shine absolute inset-0 bg-[linear-gradient(120deg,rgba(255,255,255,0)40%,rgba(255,255,255,1)50%,rgba(255,255,255,0)60%)] opacity-10 dark:opacity-20"
								/>
							</Pricing.BuyButton>
						</Pricing.Product>
					</Pricing.Root>
				) : null,

			/**
			 * Conditional wrapper that shows children only when there's an active discount.
			 * Supports an optional fallback for when there's no discount.
			 *
			 * @example
			 * ```mdx
			 * <HasDiscount>
			 *   🎉 Save {percentOff}% - Sale ends <DiscountDeadline />!
			 * </HasDiscount>
			 *
			 * <HasDiscount fallback={<>Regular pricing</>}>
			 *   Discounted content
			 * </HasDiscount>
			 * ```
			 */
			HasDiscount: ({
				children,
				fallback,
			}: {
				children: React.ReactNode
				fallback?: React.ReactNode
			}) => {
				const hasDefaultCoupon = saleData || defaultCoupon
				return hasDefaultCoupon ? (
					<>{children}</>
				) : fallback ? (
					<>{fallback}</>
				) : null
			},

			/**
			 * Countdown timer showing time remaining until discount expires.
			 * Only renders when there's an active discount with an expiration date.
			 *
			 * @example
			 * ```mdx
			 * Sale ends in <DiscountCountdown />
			 * ```
			 */
			DiscountCountdown: () => {
				return defaultCoupon?.expires ? (
					<DiscountCountdown date={new Date(defaultCoupon.expires)} />
				) : null
			},

			/**
			 * Inline price display. Use type="original" for full price or type="discounted" for sale price.
			 *
			 * @example
			 * ```mdx
			 * ~~<PricingInline type="original" />~~ → <PricingInline type="discounted" />
			 * ```
			 */
			PricingInline: ({ type }: { type: 'original' | 'discounted' }) => (
				<PricingInline type={type} pricingDataLoader={pricingDataLoader} />
			),

			/**
			 * Displays the discount deadline date.
			 *
			 * @example
			 * ```mdx
			 * Offer valid until <DiscountDeadline format="long" />
			 * <!-- Output: Offer valid until January 31, 2026 -->
			 *
			 * Ends <DiscountDeadline format="short" />
			 * <!-- Output: Ends Jan 31 -->
			 * ```
			 */
			DiscountDeadline: ({ format }: { format?: 'short' | 'long' }) => (
				<DiscountDeadline
					format={format}
					expires={defaultCoupon?.expires ?? null}
				/>
			),

			/**
			 * Conditional wrapper that shows children only when user has purchased a specific product.
			 *
			 * @example
			 * ```mdx
			 * <HasPurchased productSlug="pro-workshop">
			 *   🎉 As a Pro Workshop owner, you get 50% off!
			 * </HasPurchased>
			 * ```
			 */
			HasPurchased: ({
				productSlug,
				productId,
				children,
			}: {
				productSlug?: string
				productId?: string
				children: React.ReactNode
			}) => (
				<HasPurchased
					productSlug={productSlug}
					productId={productId}
					purchases={purchases || []}
					productMap={productMap}
				>
					{children}
				</HasPurchased>
			),
		},
		{
			scope: discountScope,
		},
	)

	return <>{content}</>
}
