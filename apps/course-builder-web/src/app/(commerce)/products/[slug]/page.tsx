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

async function ProductDetails({
	productLoader,
}: {
	productLoader: Promise<Product | null>
}) {
	const product = await productLoader

	if (!product) {
		notFound()
	}

	return (
		<div className="flex flex-col gap-10 pt-10 md:flex-row md:gap-16 md:pt-16">
			<ReactMarkdown className="prose dark:prose-invert sm:prose-lg max-w-none">
				{product.fields?.body}
			</ReactMarkdown>
			{product.fields?.description && (
				<aside className="prose dark:prose-invert prose-sm mt-3 flex w-full flex-shrink-0 flex-col gap-3 md:max-w-[280px]">
					<div className="border-t pt-5">
						<strong>Description</strong>
						<ReactMarkdown>{product.fields?.description}</ReactMarkdown>
					</div>
				</aside>
			)}
		</div>
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
}: {
	params: { slug: string }
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
				<ProductTitle productLoader={productLoader} />
				<ProductDetails productLoader={productLoader} />
				<ProductCommerce productLoader={productLoader} />
			</article>
		</div>
	)
}

async function ProductCommerce({
	productLoader,
}: {
	productLoader: Promise<Product | null>
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
		...commerceProps,
	}

	console.log({ baseProps })

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
			...(existingPurchase && {
				purchasedProductIds: [existingPurchase.productId],
				existingPurchase,
			}),
		}
	}

	return <ProductPricing {...productProps} />
}
