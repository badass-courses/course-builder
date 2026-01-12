import { ParsedUrlQuery } from 'querystring'
import * as React from 'react'
import { Suspense } from 'react'
import type { Metadata, ResolvingMetadata } from 'next'
import { headers } from 'next/headers'
import Link from 'next/link'
import { PricingWidget } from '@/app/(content)/workshops/_components/pricing-widget'
import { courseBuilderAdapter, db } from '@/db'
import { products, purchases } from '@/db/schema'
import { getPricingData } from '@/lib/pricing-query'
import { getProduct } from '@/lib/products-query'
import { getServerAuthSession } from '@/server/auth'
import { getOGImageUrlForResource } from '@/utils/get-og-image-url-for-resource'
import { count, eq } from 'drizzle-orm'

import { PriceCheckProvider } from '@coursebuilder/commerce-next/pricing/pricing-check-context'
import { propsForCommerce } from '@coursebuilder/core/pricing/props-for-commerce'
import { Product, Purchase } from '@coursebuilder/core/schemas'
import { Button } from '@coursebuilder/ui'

export async function generateMetadata(
	props: {
		params: Promise<{ slug: string }>
		searchParams: Promise<ParsedUrlQuery>
	},
	parent: ResolvingMetadata,
): Promise<Metadata> {
	const params = await props.params
	const product = await getProduct(params.slug)

	if (!product) {
		return parent as Metadata
	}

	return {
		title: product.name,
		openGraph: {
			images: [getOGImageUrlForResource(product)],
		},
	}
}

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

export default async function ProductPage(props: {
	params: Promise<{ slug: string }>
	//arbitrary search params or query string
	searchParams: Promise<ParsedUrlQuery>
}) {
	const searchParams = await props.searchParams
	const params = await props.params
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
			<article className="max-w-(--breakpoint-lg) mx-auto flex w-full flex-col px-5 py-10 md:py-16">
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
	if (!product) return null
	const pricingDataLoader = getPricingData({ productId: product?.id })
	let productProps: any

	const headersList = await headers()
	const countryCode =
		headersList.get('x-vercel-ip-country') ||
		process.env.DEFAULT_COUNTRY ||
		'US'

	const currentOrganization = headersList.get('x-organization-id')

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
						purchasedProductIds: [existingPurchase?.productId, '72', 69],
						existingPurchase: existingPurchase,
					}
				: {}),
			organizationId: currentOrganization,
		}
	}

	const purchasedProductIds = productProps.purchasedProductIds || []
	const organizationId = productProps.organizationId

	return (
		<Suspense>
			<PriceCheckProvider
				purchasedProductIds={purchasedProductIds}
				organizationId={organizationId}
			>
				<PricingWidget
					product={product}
					quantityAvailable={quantityAvailable}
					commerceProps={commerceProps}
					pricingDataLoader={pricingDataLoader}
					hasPurchasedCurrentProduct={productProps.hasPurchasedCurrentProduct}
					workshops={[]} // No workshops for regular product pages
					pricingWidgetOptions={{
						withImage: product.type !== 'live',
						withGuaranteeBadge: product.type !== 'live',
						isLiveEvent: product.type === 'live',
						isCohort: product.type === 'cohort',
						isPPPEnabled: !['live', 'cohort'].includes(product.type as string),
						cancelUrl: `${process.env.NEXT_PUBLIC_URL || ''}/products/${product.fields?.slug || product.id}`,
						allowTeamPurchase: product.type !== 'membership',
						teamQuantityLimit:
							product.type === 'live'
								? quantityAvailable && quantityAvailable > 5
									? 5
									: quantityAvailable
								: 100,
					}}
				/>
			</PriceCheckProvider>
		</Suspense>
	)
}
