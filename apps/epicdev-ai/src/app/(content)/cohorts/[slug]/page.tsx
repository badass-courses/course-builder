import type { ParsedUrlQuery } from 'querystring'
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
import { products, purchases, users } from '@/db/schema'
import { env } from '@/env.mjs'
import { checkCohortCertificateEligibility } from '@/lib/certificates'
import { Cohort } from '@/lib/cohort'
import { getCohort } from '@/lib/cohorts-query'
import { getLoyaltyCouponForUser } from '@/lib/coupons-query'
import { getPricingData } from '@/lib/pricing-query'
import { getModuleProgressForUser } from '@/lib/progress'
import type { Workshop } from '@/lib/workshops'
import { getCachedWorkshopNavigation } from '@/lib/workshops-query'
import { getProviders, getServerAuthSession } from '@/server/auth'
import { compileMDX } from '@/utils/compile-mdx'
import { formatCohortDateRange } from '@/utils/format-cohort-date'
import { differenceInCalendarDays } from 'date-fns'
import { count, eq } from 'drizzle-orm'
import { CheckCircle, Construction } from 'lucide-react'
import { Event as CohortMetaSchema, Ticket } from 'schema-dts'

import {
	propsForCommerce,
	type PropsForCommerce,
} from '@coursebuilder/core/pricing/props-for-commerce'
import { Product, productSchema, Purchase } from '@coursebuilder/core/schemas'
import { first } from '@coursebuilder/nodash'
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
	Alert,
	AlertTitle,
	Button,
	Card,
} from '@coursebuilder/ui'
import { cn } from '@coursebuilder/ui/utils/cn'
import { getResourcePath } from '@coursebuilder/utils-resource/resource-paths'

import { Certificate } from '../../_components/cohort-certificate-container'
import { ModuleProgressProvider } from '../../_components/module-progress-provider'
import {
	BuyTicketButton,
	EventPricingButton,
} from '../../events/[slug]/_components/inline-event-pricing'
import { WorkshopNavigationProvider } from '../../workshops/_components/workshop-navigation-provider'
import { WorkshopLessonList } from './_components/cohort-list/workshop-lesson-list'
import { CohortPageProps } from './_components/cohort-page-props'
import { CohortPricingWidgetContainer } from './_components/cohort-pricing-widget-container'
import { CohortSidebar } from './_components/cohort-sidebar'
import ConnectDiscordButton from './_components/connect-discord-button'
import { OfficeHoursSection } from './_components/office-hours-section'

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
		openGraph: {
			images: [
				{
					url: `${env.NEXT_PUBLIC_URL}/api/og/default?title=${encodeURIComponent(cohort.fields.title)}`,
				},
				// getOGImageUrlForResource({
				// 	fields: { slug: cohort.fields.slug },
				// 	id: cohort.id,
				// 	updatedAt: cohort.updatedAt,
				// }),
			],
		},
	}
}

export default async function CohortPage(props: {
	params: Promise<{ slug: string }>
	searchParams: Promise<ParsedUrlQuery>
}) {
	const searchParams = await props.searchParams
	const { allowPurchase } = await props.searchParams

	const params = await props.params
	const { session, ability } = await getServerAuthSession()
	const user = session?.user
	const currentOrganization = (await headers()).get('x-organization-id')
	const cohort = await getCohort(params.slug)

	if (!cohort) {
		notFound()
	}

	const { hasCompletedCohort } = await checkCohortCertificateEligibility(
		cohort.id,
		user?.id,
	)

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
			organizationId: currentOrganization,
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
					hasPurchasedCurrentProduct: Boolean(
						purchase &&
							(purchase.status === 'Valid' || purchase.status === 'Restricted'),
					),
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

	const workshops: Workshop[] =
		cohort.resources?.map((resource) => resource.resource) ?? []

	// Parse cohort start date once for day calculation
	const cohortStartDate = startsAt ? new Date(startsAt) : null

	const ALLOW_PURCHASE =
		allowPurchase === 'true' ||
		cohortProps?.product?.fields.state === 'published'

	const hasPurchasedCurrentProduct = cohortProps.hasPurchasedCurrentProduct

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

	const { content } = await compileMDX(cohort.fields.body || '', {
		RegisterNow: (props) => (
			<EventPricingButton
				cohort={cohort}
				pricingDataLoader={cohortProps.pricingDataLoader}
				pricingProps={cohortProps as PropsForCommerce}
				centered={false}
				pricingOptions={{
					withTitle: false,
					withImage: false,
				}}
				{...props}
			/>
		),
		WorkshopCard: (props) => (
			<Card
				className={cn(
					'[&_strong]:text-primary mb-3 px-5 pt-5 md:px-8 md:pt-8 [&_h3]:first-of-type:mb-0 [&_h3]:first-of-type:mt-0 [&_h3]:first-of-type:pt-0',
					props.className,
				)}
			>
				{props.children}
			</Card>
		),
	})

	const loyaltyCoupon = user?.id
		? await getLoyaltyCouponForUser(user.id)
		: undefined

	return (
		<LayoutClient withContainer>
			<main className="relative">
				<CohortMetadata
					cohort={cohort}
					quantityAvailable={cohortProps.quantityAvailable}
				/>
				{cohort && ability.can('update', 'Content') && (
					<div className="absolute right-3 top-3 z-10 flex items-center gap-2">
						{product && (
							<Button
								asChild
								size="sm"
								variant="secondary"
								className="bg-secondary/50 border-foreground/20 backdrop-blur-xs border"
							>
								<Link
									href={`/products/${product?.fields?.slug || product?.id}/edit`}
								>
									Edit Product
								</Link>
							</Button>
						)}
						<Button
							asChild
							size="sm"
							variant="secondary"
							className="bg-secondary/50 border-foreground/20 backdrop-blur-xs border"
						>
							<Link href={`/cohorts/${cohort.fields?.slug || cohort.id}/edit`}>
								Edit Cohort
							</Link>
						</Button>
					</div>
				)}
				{hasPurchasedCurrentProduct ? (
					<div className="bg-card mb-5 flex w-full flex-col items-center justify-between gap-3 rounded-lg border p-3 text-left sm:flex-row">
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

				<div className="flex flex-col gap-10 pb-16 lg:flex-row">
					<div className="w-full">
						<header className="flex w-full flex-col items-center justify-between md:gap-10 lg:flex-row">
							{fields?.image && (
								<CldImage
									className="flex w-full rounded-lg lg:hidden"
									width={383}
									height={204}
									src={fields?.image}
									alt={fields?.title}
								/>
							)}
							<div className="mt-5 flex w-full flex-col items-center text-center md:mt-5 md:items-start md:text-left">
								<div className="text-foreground/80 mb-2 flex flex-wrap items-center justify-center gap-2 text-base sm:justify-start">
									<span className="text-foreground/80 font-heading text-xs font-semibold uppercase sm:text-xs">
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

								<h1 className="font-heading leading-tighter text-balance text-3xl font-bold tracking-tight sm:text-4xl sm:leading-tight lg:text-5xl lg:leading-tight">
									{fields.title}
								</h1>
								{fields.description && (
									<h2 className="font-heading text-primary mt-3 text-lg font-medium tracking-tight sm:text-xl lg:text-[1.25rem]">
										{fields.description}
									</h2>
								)}
								<Contributor
									imageSize={60}
									className="mt-8 [&_div]:text-left"
									withBio
								/>
							</div>
						</header>
						<article className="prose sm:prose-lg lg:prose-lg prose-p:max-w-4xl prose-headings:max-w-4xl prose-ul:max-w-4xl prose-table:max-w-4xl prose-pre:max-w-4xl **:data-pre:max-w-4xl max-w-none py-10">
							{content}
						</article>
						<div className="mt-2">
							<h2 className="mb-5 text-2xl font-semibold tracking-tight sm:text-3xl">
								Your Learning Schedule
							</h2>
							<ul className="flex flex-col gap-2">
								{workshops.length === 0 ? (
									<li className="flex items-center">
										<Alert
											variant="default"
											className="text-muted-foreground flex items-center"
										>
											<Construction className="!text-primary size-4" />
											<AlertTitle>Workshops TBA</AlertTitle>
										</Alert>
									</li>
								) : (
									<>
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
																className="bg-card border-b! rounded-lg border px-4 pb-1 shadow-[0px_4px_38px_-14px_rgba(0,_0,_0,_0.1)]"
															>
																<div className="relative flex items-center justify-between">
																	{workshop.fields.state === 'published' &&
																	workshop.fields.visibility === 'public' ? (
																		<Link
																			className={cn(
																				'text-foreground hover:text-primary flex flex-col py-2 pt-3 text-lg font-semibold leading-tight transition ease-in-out',
																				{
																					'max-w-[90%]':
																						workshop.resources &&
																						workshop.resources.length > 0,
																				},
																			)}
																			href={getResourcePath(
																				'workshop',
																				workshop.fields.slug,
																				'view',
																			)}
																		>
																			<div className="flex flex-col justify-between sm:flex-row sm:items-center sm:gap-2">
																				<div className="font-bold">
																					{workshop.fields.title}
																				</div>{' '}
																				<div className="text-primary text-sm font-medium">
																					Available from {workshopDateString}
																				</div>
																			</div>
																			{workshop.fields.description && (
																				<p className="mt-1 text-sm font-normal opacity-80">
																					{workshop.fields.description}
																				</p>
																			)}
																		</Link>
																	) : (
																		<div
																			className={cn(
																				'text-foreground flex w-full flex-col py-2 pt-3 text-lg font-semibold leading-tight',
																				{
																					'max-w-[90%]':
																						workshop.resources &&
																						workshop.resources.length > 0,
																				},
																			)}
																		>
																			<div className="flex flex-col justify-between sm:flex-row sm:items-center sm:gap-2">
																				<div className="font-bold">
																					{workshop.fields.title}
																				</div>{' '}
																				<div className="text-primary text-sm font-medium">
																					Available from {workshopDateString}
																				</div>
																			</div>
																			{workshop.fields.description && (
																				<p className="mt-1 text-sm font-normal opacity-80">
																					{workshop.fields.description}
																				</p>
																			)}
																		</div>
																	)}
																	{workshop.resources &&
																		workshop.resources.length > 0 && (
																			<AccordionTrigger
																				aria-label="Toggle lessons"
																				className="bg-secondary hover:bg-foreground/20 [&_svg]:translate-y-0.3 absolute right-1 top-2 z-10 flex size-6 items-center justify-center rounded py-0"
																			/>
																		)}
																</div>
																{workshop.resources &&
																	workshop.resources.length > 0 && (
																		<AccordionContent className="border-b-0 pb-2">
																			{/* Display formatted workshop date/time */}
																			<div className="text-muted-foreground text-sm">
																				{/* {dayNumber !== null && (
												<span className="font-semibold">Day {dayNumber}: </span>
											)} */}
																			</div>
																			<ol className="list-inside list-none">
																				<WorkshopListRowRenderer
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
									</>
								)}
							</ul>
						</div>

						{/* Office Hours Section */}
						{cohort.fields.officeHours?.enabled &&
							cohort.fields.officeHours?.events && (
								<OfficeHoursSection
									events={cohort.fields.officeHours.events}
									hasPurchased={hasPurchasedCurrentProduct}
									canEdit={ability.can('update', 'Content')}
								/>
							)}
					</div>
					<CohortSidebar cohort={cohort} sticky={!hasPurchasedCurrentProduct}>
						{fields?.image && (
							<CldImage
								className="hidden rounded-t-lg lg:flex"
								width={383}
								height={204}
								src={fields?.image}
								alt={fields?.title}
							/>
						)}
						{/* <CohortDetails cohort={cohort} /> */}
						{hasPurchasedCurrentProduct ? (
							<div>
								<div className="flex h-12 items-center border-b border-dotted px-2.5 py-2 text-lg font-semibold">
									Workshops
								</div>
								<ol className="flex flex-col">
									{workshops.length === 0 ? (
										<li className="flex items-center">
											<Alert
												variant="default"
												className="text-muted-foreground flex items-center"
											>
												<Construction className="!text-primary size-4" />
												<AlertTitle>Workshops TBA</AlertTitle>
											</Alert>
										</li>
									) : (
										<>
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
												return (
													<li key={workshop.id}>
														<ModuleProgressProvider
															moduleProgressLoader={moduleProgressLoader}
														>
															<Accordion type="multiple">
																<AccordionItem value={workshop.id}>
																	<div className="relative flex items-center justify-between">
																		{workshop.fields.state === 'published' &&
																		workshop.fields.visibility === 'public' ? (
																			<Link
																				className="text-foreground hover:text-primary hover:bg-muted/50 flex w-full items-center justify-between py-2.5 pl-3 pr-10 text-base font-semibold transition ease-in-out"
																				href={getResourcePath(
																					'workshop',
																					workshop.fields.slug,
																					'view',
																				)}
																			>
																				{workshop.fields.title.includes(':')
																					? workshop.fields.title.split(':')[1]
																					: workshop.fields.title}
																			</Link>
																		) : (
																			<div className="text-foreground flex w-full items-center justify-between py-2.5 pl-3 pr-10 text-base font-semibold">
																				{workshop.fields.title.includes(':')
																					? workshop.fields.title.split(':')[1]
																					: workshop.fields.title}
																			</div>
																		)}

																		<AccordionTrigger
																			aria-label="Toggle lessons"
																			className="bg-secondary hover:bg-foreground/20 [&_svg]:translate-y-0.3 absolute right-1 top-2 z-10 flex size-6 items-center justify-center rounded py-0"
																		/>
																	</div>
																	<AccordionContent>
																		<ol className="divide-border list-inside list-none divide-y border-b">
																			<WorkshopListRowRenderer
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
										</>
									)}
								</ol>
								<div className="bg-muted/50 border-t p-5 pt-5">
									<Certificate
										isCompleted={hasCompletedCohort}
										resourceSlugOrId={cohort.fields?.slug}
									/>
								</div>
							</div>
						) : ALLOW_PURCHASE ? (
							<CohortPricingWidgetContainer
								{...cohortProps}
								couponFromCode={
									loyaltyCoupon ? loyaltyCoupon : cohortProps.couponFromCode
								}
								couponIdFromCoupon={
									loyaltyCoupon
										? loyaltyCoupon.id
										: cohortProps.couponIdFromCoupon
								}
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

const WorkshopListRowRenderer = ({ workshop }: { workshop: Workshop }) => {
	const workshopNavDataLoader = getCachedWorkshopNavigation(
		workshop.fields.slug,
	)

	return (
		<WorkshopNavigationProvider workshopNavDataLoader={workshopNavDataLoader}>
			<WorkshopLessonList workshop={workshop} />
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
