import type { ParsedUrlQuery } from 'querystring'
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
	ResourcePricingWidget,
	ResourceScheduleDetails,
	ResourceScheduleDetailsMobile,
	ResourceShareFooter,
	ResourceSidebar,
	ResourceVisibilityBanner,
} from '@/app/(content)/_components/resource-landing'
import { CldImage } from '@/components/cld-image'
import config from '@/config'
import { db } from '@/db'
import { users } from '@/db/schema'
import { env } from '@/env.mjs'
import { checkCohortCertificateEligibility } from '@/lib/certificates'
import { Cohort } from '@/lib/cohort'
import {
	getCachedCohort,
	getCohort,
	getCohortPricing,
} from '@/lib/cohorts-query'
import { getProductSlugToIdMap } from '@/lib/product-map'
import { getModuleProgressForUser } from '@/lib/progress'
import {
	getActiveCoupon,
	getSaleBannerData,
	getSaleBannerDataFromSearchParams,
} from '@/lib/sale-banner'
import type { Workshop } from '@/lib/workshops'
import { getCachedWorkshopNavigation } from '@/lib/workshops-query'
import { getProviders, getServerAuthSession } from '@/server/auth'
import { compileMDX } from '@/utils/compile-mdx'
import { eq } from 'drizzle-orm'
import { Event as CohortMetaSchema, Ticket } from 'schema-dts'

import { Skeleton } from '@coursebuilder/ui'

import {
	Certificate,
	DefaultCertificateFallback,
} from '../../_components/cohort-certificate-container'
import {
	CohortWorkshopList,
	type WorkshopWithLoaders,
} from '../../_components/navigation/cohort-workshop-list'
import ModuleResourceList from '../../_components/navigation/module-resource-list'
import { CohortPurchasedMessage } from './_components/cohort-purchased-message'

export async function generateMetadata(
	props: {
		params: Promise<{ slug: string }>
		searchParams: Promise<{ [key: string]: string | string[] | undefined }>
	},
	parent: ResolvingMetadata,
): Promise<Metadata> {
	const params = await props.params
	const cohort = await getCachedCohort(params.slug)

	if (!cohort) {
		return parent as Metadata
	}

	return {
		title: cohort.fields.title,
		description: cohort.fields.description,
		openGraph: {
			images: [
				{
					url: `${env.NEXT_PUBLIC_URL}/api/og/default?title=${encodeURIComponent(cohort.fields.title)}`,
				},
			],
		},
	}
}

export default async function CohortPage(props: {
	params: Promise<{ slug: string }>
	searchParams: Promise<ParsedUrlQuery>
}) {
	const searchParams = await props.searchParams

	const params = await props.params
	const { session, ability } = await getServerAuthSession()
	const user = session?.user
	const cohort = await getCohort(params.slug)

	if (!cohort) {
		notFound()
	}

	const cohortPricingLoader = getCohortPricing(cohort, searchParams)

	const { fields } = cohort

	const workshops: Workshop[] =
		cohort.resources?.map((resource) => resource.resource) ?? []

	// Create loaders in server component to pass to client component
	const workshopsWithLoaders: WorkshopWithLoaders[] = workshops.map(
		(workshop) => ({
			workshop,
			moduleProgressLoader: getModuleProgressForUser(workshop.fields.slug),
			workshopNavDataLoader: getCachedWorkshopNavigation(workshop.id, {
				caller: 'cohort.page',
				depth: 2,
			}),
		}),
	)

	const certificateLegibilityLoader = checkCohortCertificateEligibility(
		cohort.id,
		user?.id,
	)

	const cohortPricingData = await cohortPricingLoader
	const productMap = await getProductSlugToIdMap()
	const defaultCoupon = await getActiveCoupon(searchParams)
	const saleData = await getSaleBannerData(defaultCoupon)

	const mdxComponents = createPricingMdxComponents({
		product: cohortPricingData.product,
		hasPurchasedCurrentProduct: cohortPricingData.hasPurchasedCurrentProduct,
		pricingDataLoader: cohortPricingData.pricingDataLoader,
		commerceProps: cohortPricingData,
		allowPurchase: cohortPricingData.allowPurchase,
		defaultCoupon,
		saleData,
		productMap,
	})

	const { content } = await compileMDX(cohort.fields.body || '', mdxComponents)

	const providers = getProviders()
	const userWithAccountsLoader = user?.id
		? db.query.users.findFirst({
				where: eq(users.id, user.id),
				with: {
					accounts: true,
				},
			})
		: null

	const saleBannerData = await getSaleBannerDataFromSearchParams(searchParams)

	return (
		<ResourceLayout
			saleBannerData={saleBannerData}
			sidebar={
				<ResourceSidebar>
					{fields?.image && (
						<CldImage
							className="hidden lg:flex"
							width={798}
							height={448}
							src={fields?.image}
							alt={fields?.title}
						/>
					)}
					<ResourceScheduleDetails
						schedule={{
							startsAt: fields.startsAt,
							endsAt: fields.endsAt,
							timezone: fields.timezone,
						}}
					/>
					<React.Suspense
						fallback={
							<div className="flex flex-col gap-2 p-6">
								<Skeleton className="bg-muted h-5 w-full" />
								<Skeleton className="bg-muted h-16 w-full" />
								<Skeleton className="bg-muted h-8 w-full" />
								<Skeleton className="bg-muted h-14 w-full" />
								<Skeleton className="bg-muted h-5 w-full" />
								<Skeleton className="h-5 w-full bg-transparent" />
								<Skeleton className="bg-muted h-20 w-full" />
							</div>
						}
					>
						<CohortPurchasedMessage
							cohort={cohort}
							providers={providers}
							cohortPricingLoader={cohortPricingLoader}
							userWithAccountsLoader={userWithAccountsLoader}
						/>
						<ResourcePricingWidget
							resourceType="cohort"
							resourceSlug={cohort.fields?.slug || ''}
							pricingDataLoader={cohortPricingLoader}
							enrollment={{
								startsAt: fields.startsAt,
								endsAt: fields.endsAt,
								timezone: fields.timezone,
							}}
							waitlist={{ enabled: true }}
							workshops={workshops.map((w) => ({
								title: w.fields?.title || '',
								slug: w.fields?.slug || '',
							}))}
							mobileCta={
								<ResourceScheduleDetailsMobile
									schedule={{
										startsAt: fields.startsAt,
										endsAt: fields.endsAt,
										timezone: fields.timezone,
									}}
									buttonText="Enroll"
								/>
							}
						>
							<div>
								<div className="flex h-12 items-center border-b px-2.5 py-3 text-lg font-semibold">
									Workshops
								</div>
								<ModuleResourceList
									options={{
										stretchToFullViewportHeight: false,
										isCollapsible: false,
										withHeader: false,
									}}
								/>
								<React.Suspense fallback={<DefaultCertificateFallback />}>
									<Certificate
										certificateLegibilityLoader={certificateLegibilityLoader}
										resourceSlugOrId={cohort.fields?.slug}
									/>
								</React.Suspense>
							</div>
						</ResourcePricingWidget>
					</React.Suspense>
				</ResourceSidebar>
			}
		>
			<ResourceVisibilityBanner
				visibility={fields.visibility}
				resourceType="cohort"
			/>
			<ResourceHeader
				visibility={fields.visibility}
				badge={{ label: 'Cohort-based Course' }}
				title={fields.title}
				description={fields.description}
				image={
					fields?.image ? { url: fields.image, alt: fields.title } : undefined
				}
				contributor={{ withBio: true, label: 'Hosted by' }}
				adminActions={
					<ResourceAdminActions
						resourceType="cohort"
						resourceSlugOrId={cohort.fields?.slug || cohort.id}
						product={cohortPricingData.product}
					/>
				}
			>
				<ResourceActions title={fields.title} />
			</ResourceHeader>
			<ResourceBody>{content}</ResourceBody>
			{workshopsWithLoaders.length > 0 && (
				<div className="mt-5">
					<h2 className="mb-5 text-2xl font-semibold">
						Your learning schedule
					</h2>
					<CohortWorkshopList workshopsWithLoaders={workshopsWithLoaders} />
				</div>
			)}
			<ResourceShareFooter title={fields.title} />
		</ResourceLayout>
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
