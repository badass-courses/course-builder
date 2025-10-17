import type { ParsedUrlQuery } from 'querystring'
import * as React from 'react'
import type { Metadata, ResolvingMetadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { CldImage } from '@/components/cld-image'
import { Contributor } from '@/components/contributor'
import LayoutClient from '@/components/layout-client'
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
import { getModuleProgressForUser } from '@/lib/progress'
import type { Workshop } from '@/lib/workshops'
import { getCachedWorkshopNavigation } from '@/lib/workshops-query'
import { getProviders, getServerAuthSession } from '@/server/auth'
import { compileMDX } from '@/utils/compile-mdx'
import { formatCohortDateRange } from '@/utils/format-cohort-date'
import { differenceInCalendarDays } from 'date-fns'
import { eq } from 'drizzle-orm'
import { Event as CohortMetaSchema, Ticket } from 'schema-dts'

import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
	Skeleton,
} from '@coursebuilder/ui'
import { getResourcePath } from '@coursebuilder/utils-resource/resource-paths'

import {
	Certificate,
	DefaultCertificateFallback,
} from '../../_components/cohort-certificate-container'
import { ModuleProgressProvider } from '../../_components/module-progress-provider'
import { CohortAdminActions } from './_components/cohort-admin-actions'
import { WorkshopListRowRenderer } from './_components/cohort-list/workshop-list-row'
import WorkshopSidebarItem from './_components/cohort-list/workshop-sidebar-item'
import { CohortPricingWidgetContainer } from './_components/cohort-pricing-widget-container'
import { CohortPurchasedMessage } from './_components/cohort-purchased-message'
import { CohortSidebar } from './_components/cohort-sidebar'

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

	const { startsAt, endsAt } = fields
	const PT = fields.timezone || 'America/Los_Angeles'

	const workshops: Workshop[] =
		cohort.resources?.map((resource) => resource.resource) ?? []

	// Parse cohort start date once for day calculation
	const cohortStartDate = startsAt ? new Date(startsAt) : null

	const certificateLegibilityLoader = checkCohortCertificateEligibility(
		cohort.id,
		user?.id,
	)

	const { content } = await compileMDX(cohort.fields.body || '')

	const providers = getProviders()
	const userWithAccountsLoader = user?.id
		? db.query.users.findFirst({
				where: eq(users.id, user.id),
				with: {
					accounts: true,
				},
			})
		: null

	return (
		<LayoutClient withContainer>
			<div className="relative min-h-[calc(100svh-var(--nav-height))] pt-10">
				{/* <CohortMetadata
					cohort={cohort}
					quantityAvailable={cohortProps.quantityAvailable}
				/> */}
				<React.Suspense fallback={null}>
					{ability.can('create', 'Content') && (
						<CohortAdminActions cohort={cohort} />
					)}
				</React.Suspense>

				<div className="flex grid-cols-12 flex-col lg:grid lg:gap-16">
					<div className="col-span-8">
						<header className="flex w-full flex-col items-center justify-between md:gap-10 lg:flex-row">
							{fields?.image && (
								<CldImage
									className="flex w-full lg:hidden"
									width={383}
									height={204}
									src={fields?.image}
									alt={fields?.title}
								/>
							)}
							<div className="flex w-full flex-col items-center text-center md:items-start md:text-left">
								<p className="text-muted-foreground block pb-5 text-sm font-medium">
									Cohort-based Course
								</p>
								<h1 className="text-balance text-3xl font-semibold sm:text-4xl lg:text-5xl">
									{fields.title}
								</h1>
								{fields.description && (
									<h2 className="text-muted-foreground mt-5 text-balance text-lg sm:text-xl">
										{fields.description}
									</h2>
								)}
								<div className="mt-8 flex flex-col gap-2">
									<span className="text-muted-foreground text-sm uppercase">
										Hosted by
									</span>
									<div className="border-border rounded-lg border px-5 pl-2">
										<Contributor
											imageSize={66}
											className="[&_div]:text-left"
											withBio
										/>
									</div>
								</div>
							</div>
						</header>
						<article className="prose dark:prose-invert sm:prose-lg lg:prose-lg max-w-none py-10">
							{content}
						</article>
						{workshops.length > 0 && (
							<div className="mt-5">
								<h2 className="mb-5 text-2xl font-semibold">
									Your learning schedule
								</h2>
								<ul className="flex flex-col gap-3">
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
										const moduleProgressLoader = getModuleProgressForUser(
											workshop.fields.slug,
										)
										const workshopNavDataLoader = getCachedWorkshopNavigation(
											workshop.fields.slug,
										)
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
															className="bg-card shadow-xs overflow-hidden rounded border"
														>
															<div className="relative flex items-stretch justify-between border-b">
																<Link
																	className="text-foreground hover:text-primary flex flex-col py-2 pl-4 pt-3 text-lg font-semibold leading-tight transition ease-in-out"
																	href={getResourcePath(
																		'workshop',
																		workshop.fields.slug,
																		'view',
																	)}
																>
																	{workshop.fields.title}{' '}
																	<div className="mt-1 text-sm font-normal opacity-80">
																		Available from {workshopDateString}
																	</div>
																</Link>
																<AccordionTrigger
																	aria-label="Toggle lessons"
																	className="hover:bg-muted [&_svg]:hover:text-primary flex aspect-square h-full w-full shrink-0 items-center justify-center rounded-none border-l bg-transparent"
																/>
															</div>
															<AccordionContent className="pb-2">
																{/* Display formatted workshop date/time */}
																<div className="text-muted-foreground text-sm">
																	{/* {dayNumber !== null && (
												<span className="font-semibold">Day {dayNumber}: </span>
											)} */}
																</div>
																<ol className="list-inside list-none">
																	<WorkshopListRowRenderer
																		workshopNavDataLoader={
																			workshopNavDataLoader
																		}
																		className="pl-10 [&_[data-state]]:left-5"
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
								</ul>
							</div>
						)}
					</div>
					<CohortSidebar cohort={cohort}>
						{fields?.image && (
							<CldImage
								className="hidden lg:flex"
								width={798}
								height={448}
								src={fields?.image}
								alt={fields?.title}
							/>
						)}
						{/* <CohortDetails cohort={cohort} /> */}

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
							<CohortPricingWidgetContainer
								// workshopNavDataLoader={workshopNavDataLoader}
								certificateLegibilityLoader={certificateLegibilityLoader}
								cohortPricingLoader={cohortPricingLoader}
								searchParams={searchParams}
							>
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
											const moduleProgressLoader = getModuleProgressForUser(
												workshop.fields.slug,
											)
											const workshopNavDataLoader = getCachedWorkshopNavigation(
												workshop.fields.slug,
											)
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
																<WorkshopSidebarItem workshop={workshop} />
																<AccordionContent>
																	<ol className="divide-border border-border list-inside list-none divide-y border-t">
																		<WorkshopListRowRenderer
																			workshopNavDataLoader={
																				workshopNavDataLoader
																			}
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
									<React.Suspense fallback={<DefaultCertificateFallback />}>
										<Certificate
											certificateLegibilityLoader={certificateLegibilityLoader}
											resourceSlugOrId={cohort.fields?.slug}
										/>
									</React.Suspense>
								</div>
							</CohortPricingWidgetContainer>
						</React.Suspense>
					</CohortSidebar>
				</div>
			</div>
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
