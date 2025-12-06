import { ParsedUrlQuery } from 'querystring'
import { headers } from 'next/headers'
import Link from 'next/link'
import { CohortPricingWidgetContainer } from '@/app/(content)/cohorts/[slug]/_components/cohort-pricing-widget-container'
import { PricingWidget } from '@/app/(content)/workshops/_components/pricing-widget'
import { courseBuilderAdapter, db } from '@/db'
import { products, purchases } from '@/db/schema'
import { env } from '@/env.mjs'
import { getCohort } from '@/lib/cohorts-query'
import { getLoyaltyCouponForUser } from '@/lib/coupons-query'
import { getPricingData } from '@/lib/pricing-query'
import { getProduct } from '@/lib/products-query'
import { getWorkshop } from '@/lib/workshops-query'
import { getServerAuthSession } from '@/server/auth'
import { count, eq } from 'drizzle-orm'
import { CheckCircle } from 'lucide-react'

import { PriceCheckProvider } from '@coursebuilder/commerce-next/pricing/pricing-check-context'
import { propsForCommerce } from '@coursebuilder/core/pricing/props-for-commerce'
import { Purchase } from '@coursebuilder/core/schemas'
import { cn } from '@coursebuilder/ui/utils/cn'
import { getResourcePath } from '@coursebuilder/utils-resource/resource-paths'

/**
 * Server-side entry for the pricing widget that resolves commerce context and
 * renders either the purchasable widget or a purchased callout.
 *
 * @param productId - The product to render pricing for.
 * @param searchParams - Query parameters forwarded for pricing context.
 */
export async function PricingWidgetServer({
	productId,
	searchParams,
}: {
	productId: string
	searchParams: ParsedUrlQuery
}) {
	const { session } = await getServerAuthSession()
	const user = session?.user

	const product = await getProduct(productId)
	let resource

	if (product?.type === 'self-paced') {
		resource = await getWorkshop(product.resources?.[0]?.resource?.fields?.slug)
	}
	if (product?.type === 'cohort') {
		resource = await getCohort(product.resources?.[0]?.resource?.fields?.slug)
	}

	if (!product) return null

	const pricingDataLoader = getPricingData({ productId: product?.id })
	let productProps: any

	const countryCode =
		(await headers()).get('x-vercel-ip-country') ||
		process.env.DEFAULT_COUNTRY ||
		'US'

	let commerceProps = await propsForCommerce(
		{
			query: {
				...searchParams,
				allowPurchase: 'true',
			},
			userId: user?.id,
			products: [product],
			countryCode,
		},
		courseBuilderAdapter,
	)

	const { count: purchaseCount } = await db
		.select({ count: count() })
		.from(purchases)
		.where(eq(purchases.productId, product.id))
		.then((res) => res[0] ?? { count: 0 })

	const productWithQuantityAvailable = await db
		.select({ quantityAvailable: products.quantityAvailable })
		.from(products)
		.where(eq(products.id, product.id))
		.then((res) => res[0])

	let quantityAvailable = -1

	if (productWithQuantityAvailable) {
		quantityAvailable =
			productWithQuantityAvailable.quantityAvailable - purchaseCount
	}

	if (quantityAvailable < 0) {
		quantityAvailable = -1
	}

	const purchaseForProduct = commerceProps.purchases?.find(
		(purchase: Purchase) => {
			return purchase.productId === product.id
		},
	)

	const baseProps = {
		availableBonuses: [],
		purchaseCount,
		quantityAvailable,
		totalQuantity: productWithQuantityAvailable?.quantityAvailable || 0,
		product,
		pricingDataLoader,
		commerceProps,
	}

	productProps = baseProps

	if (user && purchaseForProduct) {
		const { purchase, existingPurchase } =
			await courseBuilderAdapter.getPurchaseDetails(
				purchaseForProduct.id,
				user.id,
			)

		productProps = {
			...baseProps,
			hasPurchasedCurrentProduct: Boolean(purchase),
			...(Boolean(existingPurchase)
				? {
						purchasedProductIds: [existingPurchase?.productId],
						existingPurchase: existingPurchase,
					}
				: {}),
		}
	}

	const purchasedProductIds = productProps.purchasedProductIds || []
	const organizationId = productProps.organizationId

	// Extract workshops from cohort for features display
	const cohortWorkshops =
		resource?.resources?.map(({ resource }: any) => ({
			title: resource.fields.title,
			slug: resource.fields.slug,
		})) || []

	if (!resource) return null

	const loyaltyCoupon = user?.id ? await getLoyaltyCouponForUser(user.id) : null

	if (productProps.hasPurchasedCurrentProduct) {
		return (
			<div
				data-pricing-state="purchased"
				className="border-border/70 bg-card/90 flex w-full flex-col items-center justify-between gap-3 rounded-xl border px-6 py-5 text-left text-base shadow-sm sm:flex-row sm:items-center sm:gap-4 sm:text-lg"
			>
				<div className="flex flex-1 items-center justify-center gap-3 sm:justify-start">
					<CheckCircle className="size-5 shrink-0 text-emerald-600 dark:text-emerald-300" />
					<span className="leading-tight">
						You have already purchased{' '}
						{product?.type === 'cohort'
							? 'a ticket to this cohort.'
							: 'this workshop.'}
					</span>
				</div>
				<Link
					className="text-primary underline underline-offset-4"
					href={getResourcePath(resource.type, resource.fields.slug, 'view')}
				>
					View →
				</Link>
			</div>
		)
	}

	return (
		<div data-pricing-state="available" className="w-full">
			<PriceCheckProvider
				purchasedProductIds={purchasedProductIds}
				organizationId={organizationId}
			>
				{product?.type === 'cohort' && (
					<CohortPricingWidgetContainer
						className="**:aria-[live='polite']:text-5xl w-full border-b-0 pt-5"
						{...productProps}
						{...productProps.commerceProps}
						couponFromCode={
							loyaltyCoupon
								? loyaltyCoupon
								: productProps.commerceProps.couponFromCode
						}
						couponIdFromCoupon={
							loyaltyCoupon
								? loyaltyCoupon.id
								: productProps.commerceProps.couponIdFromCoupon
						}
						workshops={cohortWorkshops}
						cohort={resource}
						pricingWidgetOptions={{
							withTitle: false,
							withImage: true,
						}}
					/>
				)}
				{product?.type === 'self-paced' && (
					<PricingWidget
						className={cn('px-5')}
						workshops={[
							{
								title: resource.fields.title,
								slug: resource.fields.slug,
							},
						]}
						commerceProps={{ ...commerceProps, products: [product] }}
						hasPurchasedCurrentProduct={productProps.hasPurchasedCurrentProduct}
						product={product}
						quantityAvailable={quantityAvailable}
						pricingDataLoader={pricingDataLoader}
						pricingWidgetOptions={{
							withImage: false,
							withGuaranteeBadge: true,
							isLiveEvent: false,
							isCohort: false,
							withTitle: true,
							isPPPEnabled: true,
							cancelUrl: env.NEXT_PUBLIC_URL,
						}}
						{...commerceProps}
					/>
				)}
			</PriceCheckProvider>
		</div>
	)
}
