import { ParsedUrlQuery } from 'querystring'
import * as React from 'react'
import { Suspense } from 'react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ProductPricing } from '@/app/(commerce)/products/[slug]/_components/product-pricing'
import { EventPageProps } from '@/app/(content)/events/[slug]/_components/event-page-props'
import { courseBuilderAdapter, db } from '@/db'
import { products, purchases } from '@/db/schema'
import { getPricingData } from '@/lib/pricing-query'
import { getProduct } from '@/lib/products-query'
import { propsForCommerce } from '@/lib/props-for-commerce'
import { getServerAuthSession } from '@/server/auth'
import { count, eq } from 'drizzle-orm'
import ReactMarkdown from 'react-markdown'

import { Product, Purchase } from '@coursebuilder/core/schemas'
import { Button } from '@coursebuilder/ui'

async function ProductActionBar({
	productLoader,
}: {
	productLoader: Promise<Product | null>
}) {
	const { ability } = await getServerAuthSession()

	const product = await productLoader

	return (
		<>
			{product && ability.can('update', 'Content') ? (
				<div className="bg-muted flex h-9 w-full items-center justify-between px-1">
					<div />
					<Button asChild size="sm">
						<Link href={`/products/${product.fields?.slug || product.id}/edit`}>
							Edit
						</Link>
					</Button>
				</div>
			) : (
				<div className="bg-muted flex h-9 w-full items-center justify-between px-1" />
			)}
		</>
	)
}

async function ProductTitle({
	productLoader,
}: {
	productLoader: Promise<Product | null>
}) {
	const product = await productLoader

	return <h1 className="text-3xl font-bold sm:text-4xl">{product?.name}</h1>
}

export default async function ProductPage({
	params,
	searchParams,
}: {
	params: { slug: string }
	//arbitrary search params or query string
	searchParams: ParsedUrlQuery
}) {
	const productLoader = getProduct(params.slug)

	return (
		<div>
			<Suspense
				fallback={
					<div className="bg-muted flex h-9 w-full items-center justify-between px-1" />
				}
			>
				<ProductActionBar productLoader={productLoader} />
			</Suspense>
			<article className="mx-auto flex w-full max-w-screen-lg flex-col px-5 py-10 md:py-16">
				<ProductCommerce
					productLoader={productLoader}
					searchParams={searchParams}
				/>
			</article>
		</div>
	)
}

async function ProductCommerce({
	productLoader,
	searchParams,
}: {
	productLoader: Promise<Product | null>
	searchParams: ParsedUrlQuery
}) {
	const { session, ability } = await getServerAuthSession()
	const user = session?.user
	const product = await productLoader
	console.log({ product })
	if (!product) return null
	const pricingDataLoader = getPricingData(product?.id)
	let productProps: any

	let commerceProps = await propsForCommerce({
		query: {
			...searchParams,
			allowPurchase: 'true',
		},
		userId: user?.id,
		products: [product],
	})

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

	console.log({ baseProps })

	productProps = baseProps

	if (user && purchaseForProduct) {
		const { purchase, existingPurchase } =
			await courseBuilderAdapter.getPurchaseDetails(
				purchaseForProduct.id,
				user.id,
			)

		console.log({ purchase, existingPurchase })
		console.log('🎈', {
			...baseProps,
			hasPurchasedCurrentProduct: Boolean(purchase),
			...(Boolean(existingPurchase)
				? {
						purchasedProductIds: [existingPurchase?.productId, '72', 69],
						existingPurchase: existingPurchase,
					}
				: {}),
		})

		productProps = {
			...baseProps,
			hasPurchasedCurrentProduct: Boolean(purchase),
			...(Boolean(existingPurchase)
				? {
						purchasedProductIds: [existingPurchase?.productId, '72', 69],
						existingPurchase: existingPurchase,
					}
				: {}),
		}
	}

	console.log({ productProps })

	return (
		<Suspense>
			<ProductPricing {...productProps} />
		</Suspense>
	)
}
