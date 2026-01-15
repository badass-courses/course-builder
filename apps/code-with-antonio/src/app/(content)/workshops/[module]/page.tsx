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
	ResourceMobileCta,
	ResourceMobileCtaWithPricing,
	ResourceSidebar,
} from '@/app/(content)/_components/resource-landing'
import { CldImage } from '@/components/cld-image'
import config from '@/config'
import { db } from '@/db'
import { contentResource } from '@/db/schema'
import { env } from '@/env.mjs'
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
import { InformationCircleIcon } from '@heroicons/react/24/outline'
import { and, eq } from 'drizzle-orm'
import { ConstructionIcon, Info } from 'lucide-react'
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

export const dynamic = 'force-dynamic'

export async function generateStaticParams() {
	try {
		const workshops = await db.query.contentResource.findMany({
			where: and(eq(contentResource.type, 'workshop')),
		})

		return workshops
			.filter((workshop) => Boolean(workshop.fields?.slug))
			.map((workshop) => ({
				module: workshop.fields?.slug,
			}))
	} catch (error) {
		// If database is unavailable during build, return empty array
		// Pages will be generated on-demand instead
		console.warn(
			'Failed to generate static params for workshops, database may be unavailable:',
			error,
		)
		return []
	}
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
				product?.type === 'source-code-access' ||
				product?.type === 'membership' ? (
					<React.Suspense
						fallback={
							<div className="bg-background relative z-10 flex w-full flex-col gap-2 pb-16">
								<Skeleton className="bg-accent h-24 w-full" />
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

								const cancelUrl = `${env.NEXT_PUBLIC_URL}/workshops/${params.module}`

								// Get coupon ID for mobile CTA
								const couponId =
									restProps.couponIdFromCoupon ||
									(restProps.couponFromCode?.id ?? undefined)

								const showPricing =
									pricingProps.allowPurchase &&
									!pricingProps.hasPurchasedCurrentProduct
								const showUnpublishedPreview =
									!pricingProps.allowPurchase &&
									!pricingProps.hasPurchasedCurrentProduct

								return (
									<>
										<ResourceSidebar>
											{showPricing && (
												<PriceCheckProvider
													purchasedProductIds={restProps.purchasedProductIds}
												>
													{workshop.fields.coverImage?.url && (
														<div className="relative aspect-video w-full">
															<CldImage
																src={workshop.fields.coverImage?.url}
																alt={workshop.fields.title}
																fill
															/>
														</div>
													)}
													<PricingWidget
														className="relative z-10 px-5 pt-0"
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
															withTitle: false,
															withGuaranteeBadge: true,
															isLiveEvent: false,
															isCohort: product.type === 'cohort',
															teamQuantityLimit: 100,
															isPPPEnabled: true,
															cancelUrl,
														}}
													/>
												</PriceCheckProvider>
											)}
											{showUnpublishedPreview && (
												<>
													<div className="bg-muted/50 border-b px-4 py-3">
														<p className="text-muted-foreground inline-flex flex-wrap items-center text-sm">
															<ConstructionIcon className="mr-1 inline-block size-4" />{' '}
															Product not yet available for purchase.
														</p>
													</div>
													<ModuleResourceList
														className="w-full max-w-none border-0"
														wrapperClassName="overflow-hidden pb-0"
														options={{
															stretchToFullViewportHeight: false,
															isCollapsible: false,
															withHeader: false,
															withImage: true,
															listHeight: 300,
														}}
													/>
												</>
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
															withImage: true,
															listHeight: 500,
														}}
													/>
													<div className="p-3">
														<Certificate resourceSlugOrId={params.module} />
													</div>
												</>
											)}
										</ResourceSidebar>
										<ResourceMobileCtaWithPricing
											title={workshop?.fields?.title || ''}
											moduleType="workshop"
											moduleSlug={params.module}
											allowPurchase={pricingProps.allowPurchase ?? false}
											hasPurchased={
												pricingProps.hasPurchasedCurrentProduct ?? false
											}
											product={product}
											pricingDataLoader={restProps.pricingDataLoader}
											commerceProps={{
												...restProps,
												products: [product],
											}}
											cancelUrl={cancelUrl}
											couponId={couponId}
										/>
									</>
								)
							}}
						</WorkshopPricing>
					</React.Suspense>
				) : (
					<>
						<ResourceSidebar>
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
						<ResourceMobileCta
							mode="progress"
							title={workshop?.fields?.title || ''}
							moduleType="workshop"
							moduleSlug={params.module}
						/>
					</>
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
						<span className="text-muted-foreground mb-2 inline-flex text-sm uppercase">
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

						// Only show content list when purchasable but not yet purchased
						// (unpublished products show the list in the sidebar instead)
						if (
							pricingProps.allowPurchase &&
							!pricingProps.hasPurchasedCurrentProduct
						) {
							return (
								<div className="mt-8">
									<h3 className="mb-3 text-xl font-bold sm:text-2xl">
										Content
									</h3>
									<ModuleResourceList
										className="border-border bg-card rounded-lg border"
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

						return null
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
