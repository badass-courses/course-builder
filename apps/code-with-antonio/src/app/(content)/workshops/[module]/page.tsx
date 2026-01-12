import * as React from 'react'
import type { Metadata, ResolvingMetadata } from 'next'
import { notFound } from 'next/navigation'
import {
	createPricingMdxComponents,
	ResourceActions,
	ResourceAdminActions,
	ResourceBody,
	ResourceHeader,
	ResourceLayout,
	ResourceShareFooter,
	ResourceSidebar,
	ResourceVisibilityBanner,
} from '@/app/(content)/_components/resource-landing'
import { Contributor } from '@/components/contributor'
import config from '@/config'
import { db } from '@/db'
import { contentResource } from '@/db/schema'
import { env } from '@/env.mjs'
import { useIsMobile } from '@/hooks/use-is-mobile'
import { getProductSlugToIdMap } from '@/lib/product-map'
import {
	getActiveCoupon,
	getSaleBannerData,
	getSaleBannerDataFromSearchParams,
} from '@/lib/sale-banner'
import {
	getCachedMinimalWorkshop,
	getCachedWorkshopProduct,
} from '@/lib/workshops-query'
import { compileMDX } from '@/utils/compile-mdx'
import { getAbilityForResource } from '@/utils/get-current-ability-rules'
import { getOGImageUrlForResource } from '@/utils/get-og-image-url-for-resource'
import { and, eq } from 'drizzle-orm'
import { Course } from 'schema-dts'

import { PriceCheckProvider } from '@coursebuilder/commerce-next/pricing/pricing-check-context'
import type { ContentResource } from '@coursebuilder/core/schemas'
import { Skeleton } from '@coursebuilder/ui'

import { createWorkshopPurchaseDataLoader } from '../_components/purchase-data-provider'
import { WorkshopPricing } from '../_components/workshop-pricing-server'
import { Certificate } from '../../_components/module-certificate-container'
import ModuleResourceList from '../../_components/navigation/module-resource-list'
import { PricingWidget } from '../../_components/resource-landing'

type Props = {
	params: Promise<{ module: string }>
	searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export async function generateStaticParams() {
	const workshops = await db.query.contentResource.findMany({
		where: and(eq(contentResource.type, 'workshop')),
	})

	return workshops
		.filter((workshop) => Boolean(workshop.fields?.slug))
		.map((workshop) => ({
			module: workshop.fields?.slug,
		}))
}

export async function generateMetadata(
	props: Props,
	parent: ResolvingMetadata,
): Promise<Metadata> {
	const params = await props.params
	const workshop = await getCachedMinimalWorkshop(params.module)

	if (!workshop) {
		return parent as Metadata
	}

	return {
		title: workshop.fields?.title,
		description: workshop.fields?.description,
		openGraph: {
			images: [
				workshop.fields?.coverImage?.url
					? {
							url: workshop.fields.coverImage.url,
							alt: workshop.fields.title || '',
						}
					: getOGImageUrlForResource(
							workshop as unknown as ContentResource & {
								fields?: { slug: string }
							},
						),
			],
		},
	}
}

export default async function ModulePage(props: Props) {
	const searchParams = await props.searchParams
	const params = await props.params
	const workshop = await getCachedMinimalWorkshop(params.module)

	if (!workshop) {
		notFound()
	}

	const [ability, product] = await Promise.all([
		getAbilityForResource(undefined, params.module),
		getCachedWorkshopProduct(params.module),
	])
	const saleBannerData = await getSaleBannerDataFromSearchParams(searchParams)

	// Load purchase data for MDX components
	const purchaseData = await createWorkshopPurchaseDataLoader(
		params.module,
		searchParams,
	)
	const productMap = await getProductSlugToIdMap()
	const defaultCoupon = await getActiveCoupon(searchParams)
	const saleData = await getSaleBannerData(defaultCoupon)

	const mdxComponents = createPricingMdxComponents({
		product: purchaseData.product,
		hasPurchasedCurrentProduct: purchaseData.hasPurchasedCurrentProduct,
		pricingDataLoader: purchaseData.pricingDataLoader,
		commerceProps: purchaseData,
		allowPurchase: purchaseData.allowPurchase,
		defaultCoupon,
		saleData,
		productMap,
	})

	const { content } = await compileMDX(
		workshop.fields?.body || '',
		mdxComponents,
	)

	return (
		<ResourceLayout
			saleBannerData={saleBannerData}
			sidebarClassName="mt-17"
			sidebar={
				product?.type === 'self-paced' ||
				product?.type === 'source-code-access' ? (
					<React.Suspense
						fallback={
							<div className="bg-background relative z-10 flex w-full flex-col gap-2 p-5 pb-16">
								<Skeleton className="bg-accent h-10 w-full" />
								<Skeleton className="bg-accent h-10 w-full" />
								<Skeleton className="bg-accent h-10 w-full" />
								<Skeleton className="bg-accent h-10 w-full" />
							</div>
						}
					>
						<WorkshopPricing
							moduleSlug={params.module}
							searchParams={searchParams}
						>
							{(pricingProps) => {
								if (!pricingProps.product) {
									return null
								}

								const { product, ...restProps } = pricingProps

								return (
									<ResourceSidebar
										mobileCta={{
											title: workshop?.fields?.title || '',
											subtitle: (
												<Contributor className="gap-1 text-sm [&_img]:w-5" />
											),
											buttonText: 'Start Learning',
										}}
									>
										{pricingProps.allowPurchase &&
											!pricingProps.hasPurchasedCurrentProduct && (
												<PriceCheckProvider
													purchasedProductIds={restProps.purchasedProductIds}
												>
													<PricingWidget
														className="bg-background relative z-10 px-5"
														commerceProps={{
															...restProps,
															products: [product],
														}}
														hasPurchasedCurrentProduct={
															pricingProps.hasPurchasedCurrentProduct
														}
														product={product}
														quantityAvailable={restProps.quantityAvailable}
														pricingDataLoader={restProps.pricingDataLoader}
														options={{
															withImage: false,
															withGuaranteeBadge: true,
															isLiveEvent: false,
															isCohort: product.type === 'cohort',
															teamQuantityLimit: 100,
															isPPPEnabled: true,
															cancelUrl: `${env.NEXT_PUBLIC_URL}/workshops/${params.module}`,
														}}
													/>
												</PriceCheckProvider>
											)}
										{pricingProps.hasPurchasedCurrentProduct && (
											<>
												<ModuleResourceList
													className="border-r-0! w-full max-w-none"
													wrapperClassName="overflow-hidden pb-0 hidden md:block"
													options={{
														stretchToFullViewportHeight: false,
														isCollapsible: false,
														withHeader: false,
														withImage: false,
													}}
												/>
												<div className="p-3">
													<Certificate resourceSlugOrId={params.module} />
												</div>
											</>
										)}
									</ResourceSidebar>
								)
							}}
						</WorkshopPricing>
					</React.Suspense>
				) : (
					<ResourceSidebar
						mobileCta={{
							title: workshop?.fields?.title || '',
							subtitle: <Contributor className="gap-1 text-sm [&_img]:w-5" />,
							buttonText: 'Start Learning',
						}}
					>
						<ModuleResourceList
							className="w-full max-w-none"
							wrapperClassName="overflow-hidden pb-0"
							options={{
								stretchToFullViewportHeight: false,
								isCollapsible: false,
								withHeader: false,
								withImage: true,
								listHeight: 300,
							}}
						/>
					</ResourceSidebar>
				)
			}
		>
			<WorkshopMetadata
				title={workshop.fields?.title || ''}
				description={workshop.fields?.description || ''}
				imageUrl={workshop.fields?.coverImage?.url}
				slug={params.module}
			/>

			<ResourceHeader
				visibility={workshop.fields?.visibility}
				badge={{ label: 'Workshop' }}
				title={workshop.fields?.title || ''}
				description={workshop.fields?.description || ''}
				image={
					workshop.fields?.coverImage?.url
						? {
								url: workshop.fields.coverImage.url,
								alt: workshop.fields.title || '',
							}
						: undefined
				}
				contributor={{ withBio: true, label: 'Created by' }}
				adminActions={
					<ResourceAdminActions
						resourceType="workshop"
						resourceSlugOrId={params.module}
						product={product}
					/>
				}
			>
				<ResourceActions
					moduleType="workshop"
					moduleSlug={params.module}
					hasAccess={ability.canViewWorkshop}
					hasProduct={!!product}
					githubUrl={workshop?.fields?.github ?? undefined}
					title={workshop.fields?.title || ''}
				/>
			</ResourceHeader>
			<ResourceBody>
				{content ? (
					<>
						<span className="text-muted-foreground mb-4 text-sm uppercase">
							Overview
						</span>
						<div className="prose dark:prose-invert sm:prose-lg lg:prose-lg prose-p:max-w-4xl prose-headings:max-w-4xl prose-ul:max-w-4xl prose-table:max-w-4xl prose-pre:max-w-4xl max-w-none">
							{content}
						</div>
					</>
				) : (
					<p>No description found.</p>
				)}
				<WorkshopPricing moduleSlug={params.module} searchParams={searchParams}>
					{(pricingProps) => {
						if (!pricingProps.product) {
							return null
						}

						if (!pricingProps.hasPurchasedCurrentProduct) {
							return (
								<div className="mt-8">
									<h3 className="mb-3 text-xl font-bold sm:text-2xl">
										Content
									</h3>
									<ModuleResourceList
										className="border-border rounded-lg border"
										options={{
											stretchToFullViewportHeight: false,
											isCollapsible: false,
											withHeader: false,
											withImage: false,
											listHeight: 500,
										}}
									/>
								</div>
							)
						}
					}}
				</WorkshopPricing>
			</ResourceBody>
			{/* <ResourceShareFooter title={workshop.fields?.title || ''} /> */}
		</ResourceLayout>
	)
}

const WorkshopMetadata = ({
	title,
	description,
	imageUrl,
	slug,
}: {
	title: string
	description: string
	imageUrl?: string
	slug: string
}) => {
	const jsonLd: Course = {
		'@type': 'Course',
		name: title,
		author: config.author,
		creator: {
			'@type': 'Person',
			name: config.author,
		},
		description: description,
		...(imageUrl && { thumbnailUrl: imageUrl }),
		url: `${env.NEXT_PUBLIC_URL}/workshops/${slug}`,
	}

	return (
		<script
			type="application/ld+json"
			dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
		/>
	)
}
