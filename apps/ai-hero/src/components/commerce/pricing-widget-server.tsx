import { ParsedUrlQuery } from 'querystring'
import { headers } from 'next/headers'
import { ProductPricing } from '@/app/(commerce)/products/[slug]/_components/product-pricing'
import { courseBuilderAdapter, db } from '@/db'
import { products, purchases } from '@/db/schema'
import { getCohort } from '@/lib/cohorts-query'
import { getPricingData } from '@/lib/pricing-query'
import { getProduct } from '@/lib/products-query'
import { getServerAuthSession } from '@/server/auth'
import { count, eq } from 'drizzle-orm'

import * as Pricing from '@coursebuilder/commerce-next/pricing/pricing'
import { propsForCommerce } from '@coursebuilder/core/pricing/props-for-commerce'
import { Product, Purchase } from '@coursebuilder/core/schemas'

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

	return <ProductPricing resource={cohort} {...productProps} />
}
