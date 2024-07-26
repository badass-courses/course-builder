import * as React from 'react'
import type { Metadata, ResolvingMetadata } from 'next'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { CldImage } from '@/app/_components/cld-image'
import { Contributor } from '@/app/_components/contributor'
import { WorkshopResourceList } from '@/app/(content)/workshops/_components/workshop-resource-list'
import config from '@/config'
import { courseBuilderAdapter, db } from '@/db'
import { products, purchases } from '@/db/schema'
import { env } from '@/env.mjs'
import type { Module } from '@/lib/module'
import { getPricingData } from '@/lib/pricing-query'
import { getModuleProgressForUser } from '@/lib/progress'
import { getWorkshop, getWorkshopNavigation } from '@/lib/workshops-query'
import { getServerAuthSession } from '@/server/auth'
import { getOGImageUrlForResource } from '@/utils/get-og-image-url-for-resource'
import { count, eq } from 'drizzle-orm'
import { first } from 'lodash'
import { Construction } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import { Course } from 'schema-dts'

import { propsForCommerce } from '@coursebuilder/commerce-next/pricing/props-for-commerce'
import {
	productSchema,
	type Product,
	type Purchase,
} from '@coursebuilder/core/schemas'
import type { ContentResource } from '@coursebuilder/core/types'
import { Button } from '@coursebuilder/ui'

import { TutorialLessonList } from '../_components/tutorial-lesson-list'
import type { WorkshopPageProps } from '../_components/workshop-page-props'
import { WorkshopPricing } from '../_components/workshop-pricing'

type Props = {
	params: { module: string }
	searchParams: { [key: string]: string | string[] | undefined }
}

export async function generateMetadata(
	{ params, searchParams }: Props,
	parent: ResolvingMetadata,
): Promise<Metadata> {
	const workshop = await getWorkshop(params.module)

	if (!workshop) {
		return parent as Metadata
	}

	return {
		title: workshop.fields.title,
		description: workshop.fields.description,
		openGraph: {
			images: [
				getOGImageUrlForResource(
					workshop as unknown as ContentResource & {
						fields?: { slug: string }
					},
				),
			],
		},
	}
}

export default async function ModulePage({ params, searchParams }: Props) {
	const { ability, session } = await getServerAuthSession()

	if (!ability.can('read', 'Content')) {
		redirect('/login')
	}

	const workshop = await getWorkshop(params.module)
	const workshopNavData = await getWorkshopNavigation(params.module)

	if (!workshop) {
		notFound()
	}

	const user = session?.user

	const productParsed = productSchema.safeParse(
		first(workshop.resourceProducts)?.product,
	)

	let workshopProps: WorkshopPageProps
	let product: Product | null = null

	if (productParsed.success) {
		product = productParsed.data

		const pricingDataLoader = getPricingData({
			productId: product.id,
		})

		const commerceProps = await propsForCommerce(
			{
				query: {
					allowPurchase: 'true',
					...searchParams,
				},
				userId: user?.id,
				products: [productParsed.data],
			},
			courseBuilderAdapter,
		)

		const baseProps = {
			workshop,
			availableBonuses: [],
			product,
			pricingDataLoader,
			quantityAvailable: product.quantityAvailable,
			...commerceProps,
		}

		if (!user) {
			workshopProps = baseProps
		} else {
			const purchaseForProduct = commerceProps.purchases?.find(
				(purchase: Purchase) => {
					return purchase.productId === productSchema.parse(product).id
				},
			)

			if (!purchaseForProduct) {
				workshopProps = baseProps
			} else {
				const { purchase, existingPurchase } =
					await courseBuilderAdapter.getPurchaseDetails(
						purchaseForProduct.id,
						user.id,
					)
				const purchasedProductIds =
					commerceProps?.purchases?.map((purchase) => purchase.productId) || []
				workshopProps = {
					...baseProps,
					hasPurchasedCurrentProduct: Boolean(purchase),
					existingPurchase,
					quantityAvailable: product.quantityAvailable,
					purchasedProductIds,
				}
			}
		}
	} else {
		workshopProps = {
			workshop,
			availableBonuses: [],
			quantityAvailable: -1,
			pricingDataLoader: Promise.resolve({
				formattedPrice: null,
				purchaseToUpgrade: null,
				quantityAvailable: -1,
			}),
		}
	}

	const moduleProgress = await getModuleProgressForUser(workshop.id)

	const firstLesson = workshop.resources[0]?.resource?.resources?.[0]?.resource
	const canView = workshopProps.hasPurchasedCurrentProduct

	return (
		<>
			{workshop.fields.visibility !== 'public' && (
				<div className="bg-muted flex w-full items-center justify-center gap-2 p-3 text-center">
					<Construction className="h-4 w-4" />{' '}
					<p className="text-sm font-medium capitalize">
						{workshop.fields.visibility} {workshop.type}
					</p>
				</div>
			)}
			<main className="container relative px-0">
				<WorkshopMetadata workshop={workshop} />
				{ability.can('update', 'Content') && (
					<Button
						asChild
						variant="secondary"
						className="absolute right-5 top-5 gap-1"
					>
						<Link href={`/workshops/${params.module}/edit`}>Edit</Link>
					</Button>
				)}
				<div className="flex w-full flex-col-reverse items-center justify-between px-5 py-8 md:flex-row">
					<div className="mt-5 flex w-full flex-col items-center text-center md:mt-0 md:items-start md:text-left">
						<p className="text-primary mb-2 text-base">Pro Workshop</p>
						<h1 className="font-heading fluid-4xl font-bold">
							{workshop.fields.title}
						</h1>
						{workshop.fields.description && (
							<h2 className="fluid-lg text-muted-foreground mt-5">
								{workshop.fields.description}
							</h2>
						)}
						<Contributor className="mt-5" />
						{moduleProgress?.nextResource?.fields?.slug ? (
							<Button asChild size="lg" className="mt-10 w-full md:w-auto">
								<Link
									href={`${params.module}/${moduleProgress?.nextResource?.fields.slug}`}
								>
									Continue Watching
								</Link>
							</Button>
						) : (
							<>
								{firstLesson?.fields.slug && (
									<Button asChild size="lg" className="mt-10 w-full md:w-auto">
										<Link href={`${params.module}/${firstLesson?.fields.slug}`}>
											Start Watching
										</Link>
									</Button>
								)}
							</>
						)}
					</div>
					{workshop.fields.coverImage?.url && (
						<CldImage
							width={400}
							height={400}
							src={workshop.fields.coverImage.url}
							alt={workshop.fields.coverImage?.alt || ''}
						/>
					)}
				</div>
				<div className="flex flex-col-reverse px-5 pb-10 md:flex-row md:gap-10">
					<article className="prose sm:prose-lg w-full max-w-none py-8">
						{workshop.fields.body ? (
							<ReactMarkdown>{workshop.fields.body}</ReactMarkdown>
						) : (
							<p>No description found.</p>
						)}
					</article>
					<div className="flex w-full flex-col gap-3 sm:max-w-sm">
						{!canView && <WorkshopPricing {...workshopProps} />}
						<strong className="font-mono text-sm font-bold uppercase tracking-wide text-gray-700">
							Contents
						</strong>
						<WorkshopResourceList workshopNavigation={workshopNavData} />
						---
						<TutorialLessonList
							className="w-full max-w-none border-r-0"
							tutorial={workshop}
							moduleProgress={moduleProgress}
							maxHeight="h-auto"
							withHeader={false}
							wrapperClassName="border-x border-b bg-card overflow-hidden rounded pb-0"
							widthFadeOut={false}
						/>
					</div>
				</div>
			</main>
		</>
	)
}

const WorkshopMetadata: React.FC<{ workshop: Module }> = ({ workshop }) => {
	const jsonLd: Course = {
		'@type': 'Course',
		name: workshop?.fields.title,
		author: config.author,
		creator: {
			'@type': 'Person',
			name: config.author,
		},
		description: workshop?.fields?.description as string,
		thumbnailUrl: workshop?.fields?.coverImage?.url as string,
		url: `${env.NEXT_PUBLIC_URL}/workshops/${workshop?.fields.slug}`,
	}

	return (
		<script
			type="application/ld+json"
			dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
		/>
	)
}
