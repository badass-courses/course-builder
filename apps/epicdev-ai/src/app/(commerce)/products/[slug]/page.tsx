import { ParsedUrlQuery } from 'querystring'
import * as React from 'react'
import { Suspense } from 'react'
import type { Metadata, ResolvingMetadata } from 'next'
import { headers } from 'next/headers'
import Link from 'next/link'
import { ProductPricing } from '@/app/(commerce)/products/[slug]/_components/product-pricing'
import LayoutClient from '@/components/layout-client'
import { courseBuilderAdapter, db } from '@/db'
import { products, purchases } from '@/db/schema'
import { getPricingData } from '@/lib/pricing-query'
import { getProduct } from '@/lib/products-query'
import { getProductPurchaseData } from '@/lib/products/products.service'
import { getServerAuthSession } from '@/server/auth'
import { getOGImageUrlForResource } from '@/utils/get-og-image-url-for-resource'
import { and, count, eq } from 'drizzle-orm'

import { propsForCommerce } from '@coursebuilder/core/pricing/props-for-commerce'
import { Product, Purchase } from '@coursebuilder/core/schemas'
import { Button } from '@coursebuilder/ui'

import { CalendarInviteSection } from './_components/calendar-invite-section'
import ProductPurchasesTable from './_components/product-purchase-table'
import { getProductEventInviteStatus } from './calendar-invite-actions'

type MetadataProps = {
	params: Promise<{ slug: string }>
	searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export async function generateMetadata(
	props: MetadataProps,
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
				<div className="flex h-9 w-full items-center justify-between px-1">
					<div />
					<Button asChild size="sm">
						<Link href={`/products/${product.fields?.slug || product.id}/edit`}>
							Edit
						</Link>
					</Button>
				</div>
			) : (
				<div className="flex h-9 w-full items-center justify-between px-1" />
			)}
		</>
	)
}

async function ProductPurchaseDetails({
	productLoader,
	searchParams,
}: {
	productLoader: Promise<Product | null>
	searchParams: { [key: string]: string | string[] | undefined }
}) {
	const { ability } = await getServerAuthSession()
	const product = await productLoader

	if (!product) return null

	const page = searchParams?.page ? parseInt(String(searchParams.page), 10) : 1
	const limit = searchParams?.limit
		? parseInt(String(searchParams.limit), 10)
		: 50
	const offset = (page - 1) * limit

	const purchaseDataLoader = getProductPurchaseData({
		productIds: [product.id],
		limit,
		offset,
	})

	// Get purchase count for calendar invite section (only Valid purchases)
	const { count: purchaseCount } = await db
		.select({ count: count() })
		.from(purchases)
		.where(
			and(eq(purchases.productId, product.id), eq(purchases.status, 'Valid')),
		)
		.then((res) => res[0] ?? { count: 0 })

	// Get calendar invite status for cohort products
	const inviteStatus =
		product.type === 'cohort'
			? await getProductEventInviteStatus(product.id)
			: null

	return (
		<>
			{product && ability.can('update', 'Content') ? (
				<div className="space-y-8">
					{/* Calendar Invite Section - only shows for cohort products with office hours events */}
					<CalendarInviteSection
						product={product}
						purchaseCount={purchaseCount}
						inviteStatus={inviteStatus}
					/>

					<ProductPurchasesTable
						purchaseDataResultLoader={purchaseDataLoader}
						currentPage={page}
						pageSize={limit}
					/>
				</div>
			) : (
				<div className="flex h-9 w-full items-center justify-between px-1" />
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
	params: pageParams,
	searchParams: pageSearchParams,
}: {
	params: Promise<{ slug: string }>
	searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
	const params = await pageParams
	const searchParams = await pageSearchParams
	const productLoader = getProduct(params.slug)

	return (
		<LayoutClient>
			<div className="container flex flex-col">
				<article className="prose dark:prose-invert mx-auto w-full pt-16">
					<ProductTitle productLoader={productLoader} />
					<Suspense
						fallback={<div className="h-9 w-full" />}
						key={JSON.stringify(searchParams)}
					>
						<ProductActionBar productLoader={productLoader} />
					</Suspense>
					<ProductCommerce
						productLoader={productLoader}
						searchParams={searchParams}
					/>
				</article>
				<Suspense fallback={<div>Loading purchases...</div>}>
					<ProductPurchaseDetails
						productLoader={productLoader}
						searchParams={searchParams}
					/>
				</Suspense>
			</div>
		</LayoutClient>
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
			...(Boolean(true)
				? {
						purchasedProductIds: [existingPurchase?.productId],
						existingPurchase: purchase,
					}
				: {}),
			organizationId: currentOrganization,
		}
	}

	return (
		<Suspense>
			<ProductPricing {...productProps} />
		</Suspense>
	)
}
