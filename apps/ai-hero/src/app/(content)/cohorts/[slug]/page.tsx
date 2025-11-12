import type { ParsedUrlQuery } from 'querystring'
import * as React from 'react'
import type { Metadata, ResolvingMetadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { CldImage } from '@/components/cld-image'
import { Contributor } from '@/components/contributor'
import LayoutClient from '@/components/layout-client'
import { DiscountCountdown } from '@/components/mdx/mdx-components'
import { DiscountDeadline } from '@/components/pricing/discount-deadline'
import { HasPurchased } from '@/components/pricing/has-purchased'
import { PricingInline } from '@/components/pricing/pricing-inline'
import config from '@/config'
import { db } from '@/db'
import { products, users } from '@/db/schema'
import { env } from '@/env.mjs'
import { CohortPageProps, type Cohort } from '@/lib/cohort'
import { getCachedCohort, loadCohortPageData } from '@/lib/cohorts-query'
import type { Workshop } from '@/lib/workshops'
import { getCachedWorkshopNavigation } from '@/lib/workshops-query'
import { getProviders } from '@/server/auth'
import { compileMDX } from '@/utils/compile-mdx'
import { formatCohortDateRange } from '@/utils/format-cohort-date'
import { differenceInCalendarDays } from 'date-fns'
import { eq } from 'drizzle-orm'
import { CheckCircle } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import { Event as CohortMetaSchema, Ticket } from 'schema-dts'

import * as Pricing from '@coursebuilder/commerce-next/pricing/pricing'
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
	Button,
} from '@coursebuilder/ui'
import { getResourcePath } from '@coursebuilder/utils-resource/resource-paths'

import { Certificate } from '../../_components/cohort-certificate-container'
import { ModuleProgressProvider } from '../../_components/module-progress-provider'
import { EditWorkshopButton } from '../../workshops/_components/edit-workshop-button'
import { WorkshopNavigationProvider } from '../../workshops/_components/workshop-navigation-provider'
import { WorkshopLessonList } from './_components/cohort-list/workshop-lesson-list'
import WorkshopSidebarItem from './_components/cohort-list/workshop-sidebar-item'
import { CohortPricingWidgetContainer } from './_components/cohort-pricing-widget-container'
import { CohortSidebar } from './_components/cohort-sidebar'
import ConnectDiscordButton from './_components/connect-discord-button'

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
					url:
						cohort?.fields?.image ||
						`${env.NEXT_PUBLIC_URL}/api/og/default?title=${encodeURIComponent(cohort.fields.title)}`,
					alt: cohort?.fields?.title,
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
	const { allowPurchase } = searchParams
	const params = await props.params

	const pageData = await loadCohortPageData(params.slug, searchParams)

	const {
		cohort,
		session,
		ability,
		user,
		currentOrganization,
		hasCompletedCohort,
		product,
		pricingDataLoader,
		commerceProps,
		purchaseCount,
		quantityAvailable,
		totalQuantity,
		hasPurchasedCurrentProduct,
		existingPurchase,
		defaultCoupon,
		saleData,
		workshops,
		workshopProgressMap,
	} = pageData

	if (!cohort) {
		notFound()
	}

	const cohortProps: CohortPageProps = {
		cohort,
		availableBonuses: [],
		purchaseCount,
		quantityAvailable,
		totalQuantity,
		product: product ?? undefined,
		pricingDataLoader,
		hasPurchasedCurrentProduct,
		existingPurchase,
		...commerceProps,
		organizationId: currentOrganization,
	}

	const { fields } = cohort

	const { startsAt, endsAt } = fields
	const PT = fields.timezone || 'America/Los_Angeles'

	// Parse cohort start date once for day calculation
	const cohortStartDate = startsAt ? new Date(startsAt) : null

	const ALLOW_PURCHASE =
		allowPurchase === 'true' ||
		cohortProps?.product?.fields.state === 'published'

	const providers = getProviders()
	const discordProvider = providers?.discord
	const userWithAccountsLoader = session?.user
		? db.query.users.findFirst({
				where: eq(users.id, session.user.id),
				with: {
					accounts: true,
				},
			})
		: null

	// Get product slug to ID map for HasPurchased component
	const allProducts = await db.query.products.findMany({
		where: eq(products.status, 1),
	})
	const productMap = new Map(allProducts.map((p) => [p.fields?.slug, p.id]))
	const { content } = await compileMDX(
		cohort.fields.body || '',
		{
			Enroll: ({ children = 'Enroll Now' }) =>
				cohortProps.product && !hasPurchasedCurrentProduct ? (
					<Pricing.Root
						{...cohortProps}
						product={cohortProps.product}
						country={cohortProps.country}
						options={{
							withTitle: false,
							withImage: false,
						}}
						userId={cohortProps?.userId}
						pricingDataLoader={cohortProps.pricingDataLoader}
						className="mt-5 items-start justify-start"
					>
						<Pricing.BuyButton className="dark:bg-primary dark:hover:bg-primary/90 relative h-auto w-full cursor-pointer rounded-lg bg-blue-600 px-8 font-semibold hover:bg-blue-700 sm:h-14 sm:w-auto md:px-16">
							<span className="relative z-10">{children}</span>
							<div
								style={{
									backgroundSize: '200% 100%',
								}}
								className="animate-shine absolute inset-0 bg-[linear-gradient(120deg,rgba(255,255,255,0)40%,rgba(255,255,255,1)50%,rgba(255,255,255,0)60%)] opacity-10 dark:opacity-20"
							/>
						</Pricing.BuyButton>
					</Pricing.Root>
				) : null,
			HasDiscount: ({
				children,
				fallback,
			}: {
				children: React.ReactNode
				fallback?: React.ReactNode
			}) => {
				// Only show discount if there's an active default coupon (site-wide sale)
				const hasDefaultCoupon = saleData || defaultCoupon
				return hasDefaultCoupon ? (
					<>{children}</>
				) : fallback ? (
					<>{fallback}</>
				) : null
			},
			DiscountCountdown: ({ children }) => {
				return defaultCoupon?.expires ? (
					<DiscountCountdown date={new Date(defaultCoupon?.expires)} />
				) : null
			},
			PricingInline: ({ type }: { type: 'original' | 'discounted' }) => (
				<PricingInline
					type={type}
					pricingDataLoader={cohortProps.pricingDataLoader}
				/>
			),
			DiscountDeadline: ({ format }: { format?: 'short' | 'long' }) => (
				<DiscountDeadline
					format={format}
					expires={defaultCoupon?.expires ?? null}
				/>
			),
			HasPurchased: ({
				productSlug,
				productId,
				children,
			}: {
				productSlug?: string
				productId?: string
				children: React.ReactNode
			}) => (
				<HasPurchased
					productSlug={productSlug}
					productId={productId}
					purchases={cohortProps.purchases || []}
					productMap={productMap}
				>
					{children}
				</HasPurchased>
			),
		},
		{
			scope: {
				...(saleData
					? { ...saleData }
					: {
							percentOff: 0,
							discountFormatted: '0%',
							discountType: 'percentage',
							discountValue: 0,
						}),
			},
		},
	)

	return (
		<LayoutClient withContainer>
			<main className="relative">
				<CohortMetadata
					cohort={cohort}
					quantityAvailable={cohortProps.quantityAvailable}
				/>
				<EditWorkshopButton
					className=""
					moduleType="cohort"
					moduleSlug={cohort.fields?.slug || cohort.id}
					product={product}
				/>

				{hasPurchasedCurrentProduct ? (
					<div className="flex w-full flex-col items-center justify-between gap-3 border-b p-3 text-left sm:flex-row">
						<div className="flex items-center">
							<CheckCircle className="mr-2 size-4 text-emerald-600 dark:text-emerald-300" />{' '}
							You have purchased a ticket to this cohort.
						</div>
						<React.Suspense fallback={null}>
							<ConnectDiscordButton
								userWithAccountsLoader={userWithAccountsLoader}
								discordProvider={discordProvider}
							/>
						</React.Suspense>
					</div>
				) : null}

				<div className="flex flex-col lg:flex-row">
					<div>
						<header className="from-card to-background flex w-full flex-col items-center justify-between bg-gradient-to-b pl-5 md:gap-10 lg:flex-row lg:pl-10 lg:pt-8">
							{fields?.image && (
								<CldImage
									className="flex w-full lg:hidden"
									width={383}
									height={204}
									src={fields?.image}
									alt={fields?.title}
								/>
							)}
							<div className="mt-5 flex w-full flex-col items-center text-center md:mt-0 md:items-start md:text-left">
								<div className="text-foreground/80 mb-2 flex flex-wrap items-center justify-center gap-2 text-base sm:justify-start">
									<span className="text-xs font-medium uppercase tracking-wider">
										Cohort-based Course
									</span>
									{/* <span className="hidden opacity-50 sm:inline-block">・</span>
							{eventDateString && <p>{eventDateString}</p>}
							{eventTimeString && (
								<>
									<span className="opacity-50">・</span>
									<p>{eventTimeString}</p>
								</>
							)} */}
								</div>
								<h1 className="text-balance text-4xl font-bold sm:text-5xl lg:text-6xl">
									{fields.title}
								</h1>
								{fields.description && (
									<h2 className="dark:text-primary mt-5 text-balance text-lg font-normal text-blue-700 sm:text-xl lg:text-2xl">
										<ReactMarkdown
											components={{
												p: ({ children }) => <>{children}</>,
											}}
										>
											{fields.description}
										</ReactMarkdown>
									</h2>
								)}
								<Contributor
									imageSize={60}
									className="mt-8 [&_div]:text-left"
									withBio
								/>
							</div>
						</header>
						<article className="prose dark:prose-invert sm:prose-lg lg:prose-lg prose-p:max-w-4xl prose-headings:max-w-4xl prose-ul:max-w-4xl prose-table:max-w-4xl prose-pre:max-w-4xl **:data-pre:max-w-4xl max-w-none px-5 py-10 sm:px-8 lg:px-10">
							{content}
						</article>

						<div className="mt-2 border-t px-5 py-8 sm:px-8 lg:px-10">
							<h2 className="mb-5 text-2xl font-semibold">Contents</h2>
							<ul className="divide-border flex flex-col divide-y overflow-hidden rounded-xl border">
								{workshops.map((workshop, index) => {
									// Determine end date and timezone for the workshop
									// const workshopEndDate = workshop.fields.endsAt || endsAt // No longer needed for display
									const workshopTimezone = workshop.fields.timezone || PT

									// Format workshop date/time range (only start)
									const {
										dateString: workshopDateString,
										timeString: workshopTimeString,
									} = formatCohortDateRange(
										workshop.fields.startsAt,
										null, // Pass null for end date
										workshopTimezone,
									)

									// Calculate Day number
									let dayNumber: number | null = null
									if (cohortStartDate && workshop.fields.startsAt) {
										const workshopStartDate = new Date(workshop.fields.startsAt)
										// Calculate difference, add 1, and ensure it's at least 1
										dayNumber = Math.max(
											1,
											differenceInCalendarDays(
												workshopStartDate,
												cohortStartDate,
											) + 1,
										)
									}
									const moduleProgressLoader =
										workshopProgressMap.get(workshop.fields.slug) ||
										Promise.resolve(null)
									return (
										<li key={workshop.id}>
											<ModuleProgressProvider
												moduleProgressLoader={moduleProgressLoader}
											>
												<Accordion
													type="multiple"
													defaultValue={[`${workshop.id}-body`]}
												>
													<AccordionItem
														value={`${workshop.id}-body`}
														className="bg-card border-none"
													>
														<div className="relative flex items-stretch justify-between">
															<Link
																className="text-foreground dark:bg-foreground/2 hover:dark:text-primary hover:bg-muted/50 flex w-full flex-col bg-white py-4 pl-4 text-lg font-semibold leading-tight transition ease-in-out hover:text-blue-600"
																href={getResourcePath(
																	'workshop',
																	workshop.fields.slug,
																	'view',
																)}
															>
																<span className="inline-flex items-center gap-3">
																	<span className="text-muted-foreground text-[10px] font-normal opacity-75">
																		{index + 1}
																	</span>{' '}
																	<span>{workshop.fields.title}</span>
																</span>
																{workshopDateString && (
																	<div className="mt-1 text-sm font-normal opacity-80">
																		Available from {workshopDateString}
																	</div>
																)}
															</Link>
															<AccordionTrigger
																aria-label="Toggle lessons"
																className="hover:bg-muted [&_svg]:hover:text-primary flex aspect-square h-full w-10 shrink-0 items-center justify-center rounded-none border-l bg-transparent"
															/>
														</div>
														{workshop.resources &&
															workshop.resources.length > 0 && (
																<AccordionContent className="bg-background border-t pb-2 dark:bg-transparent">
																	{/* Display formatted workshop date/time */}
																	<div className="text-muted-foreground text-sm">
																		{/* {dayNumber !== null && (
												<span className="font-semibold">Day {dayNumber}: </span>
											)} */}
																	</div>
																	<ol className="list-inside list-none">
																		<WorkshopListRowRenderer
																			workshopIndex={index + 1}
																			className=""
																			workshop={workshop}
																		/>
																	</ol>
																</AccordionContent>
															)}
													</AccordionItem>
												</Accordion>
											</ModuleProgressProvider>
										</li>
									)
								})}
							</ul>
						</div>
					</div>
					<CohortSidebar cohort={cohort} sticky={!hasPurchasedCurrentProduct}>
						{fields?.image && (
							<CldImage
								className="hidden lg:flex"
								width={383}
								height={204}
								src={fields?.image}
								alt={fields?.title}
							/>
						)}
						{/* <CohortDetails cohort={cohort} /> */}
						{hasPurchasedCurrentProduct ? (
							<div>
								<div className="flex h-12 items-center border-b px-2.5 py-3 text-lg font-semibold">
									Workshops
								</div>
								<ol className="divide-border flex flex-col divide-y">
									{workshops.map((workshop, index) => {
										// Determine end date and timezone for the workshop
										// const workshopEndDate = workshop.fields.endsAt || endsAt // No longer needed for display
										const workshopTimezone = workshop.fields.timezone || PT

										// Format workshop date/time range (only start)
										const {
											dateString: workshopDateString,
											timeString: workshopTimeString,
										} = formatCohortDateRange(
											workshop.fields.startsAt,
											null, // Pass null for end date
											workshopTimezone,
										)

										// Calculate Day number
										let dayNumber: number | null = null
										if (cohortStartDate && workshop.fields.startsAt) {
											const workshopStartDate = new Date(
												workshop.fields.startsAt,
											)
											// Calculate difference, add 1, and ensure it's at least 1
											dayNumber = Math.max(
												1,
												differenceInCalendarDays(
													workshopStartDate,
													cohortStartDate,
												) + 1,
											)
										}
										const moduleProgressLoader =
											workshopProgressMap.get(workshop.fields.slug) ||
											Promise.resolve(null)
										return (
											<li key={workshop.id}>
												<ModuleProgressProvider
													moduleProgressLoader={moduleProgressLoader}
												>
													<Accordion type="multiple">
														<AccordionItem
															value={workshop.id}
															className='data-[state="open"]:bg-muted/60 transition-colors ease-out'
														>
															<WorkshopSidebarItem
																index={index + 1}
																workshop={workshop}
															/>
															<AccordionContent>
																<ol className="divide-border border-border list-inside list-none divide-y border-t">
																	<WorkshopListRowRenderer
																		workshopIndex={index + 1}
																		workshop={workshop}
																	/>
																</ol>
															</AccordionContent>
														</AccordionItem>
													</Accordion>
												</ModuleProgressProvider>
											</li>
										)
									})}
								</ol>
								<Certificate
									isCompleted={hasCompletedCohort}
									resourceSlugOrId={cohort.fields?.slug}
								/>
							</div>
						) : ALLOW_PURCHASE ? (
							<CohortPricingWidgetContainer
								{...cohortProps}
								searchParams={searchParams}
							/>
						) : null}
					</CohortSidebar>
				</div>
				{/* <CohortSidebarMobile cohort={cohort} /> */}
			</main>
		</LayoutClient>
	)
}

const WorkshopListRowRenderer = ({
	workshop,
	className,
	workshopIndex,
}: {
	workshop: Workshop
	className?: string
	workshopIndex: number
}) => {
	const workshopNavDataLoader = getCachedWorkshopNavigation(
		workshop.fields.slug,
	)

	return (
		<WorkshopNavigationProvider workshopNavDataLoader={workshopNavDataLoader}>
			<WorkshopLessonList
				workshop={workshop}
				className={className}
				workshopIndex={workshopIndex}
			/>
		</WorkshopNavigationProvider>
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
