import { ParsedUrlQuery } from 'querystring'
import { headers } from 'next/headers'
import Link from 'next/link'
import { CohortPricingWidgetContainer } from '@/app/(content)/cohorts/[slug]/_components/cohort-pricing-widget-container'
import { courseBuilderAdapter, db } from '@/db'
import { products, purchases } from '@/db/schema'
import { getCohort } from '@/lib/cohorts-query'
import { getLoyaltyCouponForUser } from '@/lib/coupons-query'
import { getPricingData } from '@/lib/pricing-query'
import { getProduct } from '@/lib/products-query'
import { getServerAuthSession } from '@/server/auth'
import { count, eq } from 'drizzle-orm'
import { CheckCircle } from 'lucide-react'

import { PriceCheckProvider } from '@coursebuilder/commerce-next/pricing/pricing-check-context'
import { propsForCommerce } from '@coursebuilder/core/pricing/props-for-commerce'
import { Purchase } from '@coursebuilder/core/schemas'
import { getResourcePath } from '@coursebuilder/utils-resource/resource-paths'

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
	const cohort = await getCohort(
		product?.resources?.[0]?.resource?.fields?.slug,
	)

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
	const workshops =
		cohort?.resources?.map(({ resource }: any) => ({
			title: resource.fields.title,
			slug: resource.fields.slug,
		})) || []

	if (!cohort) return null

	const loyaltyCoupon = user?.id ? await getLoyaltyCouponForUser(user.id) : null

	return productProps.hasPurchasedCurrentProduct ? (
		<div className="flex w-full flex-col items-center justify-center gap-2 px-10 pt-3 text-center text-lg sm:flex-row">
			<CheckCircle className="size-4 shrink-0 text-emerald-600 dark:text-emerald-300" />{' '}
			<span>You have already purchased a ticket to this cohort.</span>{' '}
			<Link
				className="text-primary underline"
				href={getResourcePath(cohort.type, cohort.fields.slug, 'view')}
			>
				View →
			</Link>
		</div>
	) : (
		<PriceCheckProvider
			purchasedProductIds={purchasedProductIds}
			organizationId={organizationId}
		>
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
				workshops={workshops}
				cohort={cohort}
				pricingWidgetOptions={{
					withTitle: false,
					withImage: true,
				}}
			/>
		</PriceCheckProvider>
	)
}
