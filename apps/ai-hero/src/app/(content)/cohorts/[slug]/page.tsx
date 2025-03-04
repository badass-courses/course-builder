import * as React from 'react'
import type { Metadata, ResolvingMetadata } from 'next'
import { headers } from 'next/headers'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { CldImage } from '@/components/cld-image'
import { Contributor } from '@/components/contributor'
import LayoutClient from '@/components/layout-client'
import config from '@/config'
import { courseBuilderAdapter, db } from '@/db'
import { products, purchases } from '@/db/schema'
import { env } from '@/env.mjs'
import { Cohort } from '@/lib/cohort'
import { getCohort } from '@/lib/cohorts-query'
import { getPricingData } from '@/lib/pricing-query'
import { getServerAuthSession } from '@/server/auth'
import { formatInTimeZone } from 'date-fns-tz'
import { count, eq } from 'drizzle-orm'
import ReactMarkdown from 'react-markdown'
import { Event as CohortMetaSchema, Ticket } from 'schema-dts'

import { propsForCommerce } from '@coursebuilder/core/pricing/props-for-commerce'
import { Product, productSchema, Purchase } from '@coursebuilder/core/schemas'
import { first } from '@coursebuilder/nodash'
import { Button } from '@coursebuilder/ui'

import { CohortDetails } from './_components/cohort-details'
import { CohortPageProps } from './_components/cohort-page-props'
import { CohortPricingWidgetContainer } from './_components/cohort-pricing-widget-container'
import { CohortSidebar } from './_components/cohort-sidebar'

export async function generateMetadata(
	props: {
		params: Promise<{ slug: string }>
		searchParams: Promise<{ [key: string]: string | string[] | undefined }>
	},
	parent: ResolvingMetadata,
): Promise<Metadata> {
	const params = await props.params
	const cohort = await getCohort(params.slug)

	if (!cohort) {
		return parent as Metadata
	}

	return {
		title: cohort.fields.title,
		description: cohort.fields.description,
	}
}

export default async function CohortPage(props: {
	params: Promise<{ slug: string }>
	searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
	const searchParams = await props.searchParams
	const params = await props.params
	const { session, ability } = await getServerAuthSession()
	const user = session?.user

	const cohort = await getCohort(params.slug)

	if (!cohort) {
		notFound()
	}

	const productParsed = productSchema.safeParse(
		first(cohort.resourceProducts)?.product,
	)

	let cohortProps: CohortPageProps
	let product: Product | null = null

	if (productParsed.success) {
		product = productParsed.data

		const pricingDataLoader = getPricingData({
			productId: product.id,
		})

		const countryCode =
			(await headers()).get('x-vercel-ip-country') ||
			process.env.DEFAULT_COUNTRY ||
			'US'
		const commerceProps = await propsForCommerce(
			{
				query: {
					allowPurchase: 'true',
					...searchParams,
				},
				userId: user?.id,
				products: [productParsed.data],
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

		const baseProps = {
			cohort,
			availableBonuses: [],
			purchaseCount,
			quantityAvailable,
			totalQuantity: productWithQuantityAvailable?.quantityAvailable || 0,
			product,
			pricingDataLoader,
			...commerceProps,
		}

		if (!user) {
			cohortProps = baseProps
		} else {
			const purchaseForProduct = commerceProps.purchases?.find(
				(purchase: Purchase) => {
					return purchase.productId === productSchema.parse(product).id
				},
			)

			if (!purchaseForProduct) {
				cohortProps = baseProps
			} else {
				const { purchase, existingPurchase } =
					await courseBuilderAdapter.getPurchaseDetails(
						purchaseForProduct.id,
						user.id,
					)
				cohortProps = {
					...baseProps,
					hasPurchasedCurrentProduct: Boolean(purchase),
					existingPurchase,
				}
			}
		}
	} else {
		cohortProps = {
			cohort,
			availableBonuses: [],
			quantityAvailable: -1,
			totalQuantity: -1,
			purchaseCount: 0,
			pricingDataLoader: Promise.resolve({
				formattedPrice: null,
				purchaseToUpgrade: null,
				quantityAvailable: -1,
			}),
		}
	}

	const { fields } = cohort

	const { startsAt, endsAt } = fields
	const PT = fields.timezone || 'America/Los_Angeles'
	const eventDate =
		startsAt && `${formatInTimeZone(new Date(startsAt), PT, 'MMMM do')}`
	const eventTime =
		startsAt &&
		endsAt &&
		`${formatInTimeZone(new Date(startsAt), PT, 'h:mm a')} — ${formatInTimeZone(
			new Date(endsAt),
			PT,
			'h:mm a',
		)}`

	return (
		<LayoutClient withContainer>
			<main className="container relative border-x px-0">
				<CohortMetadata
					cohort={cohort}
					quantityAvailable={cohortProps.quantityAvailable}
				/>
				{cohort && ability.can('update', 'Content') && (
					<div className="absolute right-5 top-5 flex items-center gap-2">
						{product && (
							<Button asChild variant="secondary">
								<Link
									href={`/products/${product?.fields?.slug || product?.id}/edit`}
								>
									Edit Product
								</Link>
							</Button>
						)}
						<Button asChild variant="secondary">
							<Link href={`/cohorts/${cohort.fields?.slug || cohort.id}/edit`}>
								Edit Cohort
							</Link>
						</Button>
					</div>
				)}
				{cohortProps.hasPurchasedCurrentProduct ? (
					<div className="flex w-full items-center border-b px-5 py-5 text-left">
						You have purchased a ticket to this event. See you on {eventDate}.{' '}
						<span role="img" aria-label="Waving hand">
							👋
						</span>
					</div>
				) : null}
				<div className="flex w-full flex-col-reverse items-center justify-between px-5 py-8 md:flex-row md:px-8 lg:px-16">
					<div className="mt-5 flex w-full flex-col items-center text-center md:mt-0 md:items-start md:text-left">
						<div className="mb-2 flex flex-wrap items-center justify-center gap-2 text-base sm:justify-start">
							<Link
								href="/events"
								className="text-primary w-full hover:underline sm:w-auto"
							>
								Live Workshop
							</Link>
							<span className="hidden opacity-50 sm:inline-block">・</span>
							<p>{eventDate}</p>
							<span className="opacity-50">・</span>
							<p>{eventTime} (PT)</p>
						</div>
						<h1 className="font-heading text-balance text-5xl font-bold text-white sm:text-6xl lg:text-7xl">
							{fields.title}
						</h1>
						{fields.description && (
							<h2 className="mt-5 text-balance text-xl">
								{fields.description}
							</h2>
						)}
						<Contributor className="mt-5" />
					</div>
					{product?.fields?.image?.url && (
						<CldImage
							width={400}
							height={400}
							src={product?.fields.image.url}
							alt={fields?.title}
						/>
					)}
				</div>
				<div className="flex flex-col-reverse border-t md:flex-row">
					<article className="prose sm:prose-lg prose-invert prose-headings:text-balance w-full max-w-none px-5 py-8 md:px-8">
						{cohort.fields.body && (
							<ReactMarkdown>{cohort.fields.body}</ReactMarkdown>
						)}
					</article>
					<CohortSidebar>
						<CohortPricingWidgetContainer {...cohortProps} />
						<CohortDetails cohort={cohort} />
					</CohortSidebar>
				</div>
			</main>
		</LayoutClient>
	)
}

const CohortMetadata: React.FC<{
	cohort: Cohort
	quantityAvailable: number
}> = ({ cohort, quantityAvailable }) => {
	const cohortJsonLd: CohortMetaSchema = {
		'@type': 'Event',
		name: cohort?.fields.title,
		startDate: cohort?.fields.startsAt as string,
		endDate: cohort?.fields.endsAt as string,
		description: cohort?.fields.description,
		inLanguage: 'en-US',
		remainingAttendeeCapacity: quantityAvailable,
		organizer: env.NEXT_PUBLIC_SITE_TITLE,
		actor: {
			'@type': 'Person',
			name: config.author,
			sameAs: [...config.sameAs],
		},
		url: `${env.NEXT_PUBLIC_URL}/cohorts/${cohort?.fields.slug}`,
	}

	const ticketJsonLd: Ticket = {
		'@type': 'Ticket',
		name: 'Workshop Ticket',
		totalPrice:
			cohort?.resourceProducts?.[0]?.product?.price?.unitAmount.toString(),
		priceCurrency: 'USD',
		url: `${env.NEXT_PUBLIC_URL}/cohorts/${cohort?.fields.slug}`,
	}

	return (
		<>
			<script
				type="application/ld+json"
				dangerouslySetInnerHTML={{
					__html: JSON.stringify(cohortJsonLd),
				}}
			/>
			<script
				type="application/ld+json"
				dangerouslySetInnerHTML={{
					__html: JSON.stringify(ticketJsonLd),
				}}
			/>
		</>
	)
}
