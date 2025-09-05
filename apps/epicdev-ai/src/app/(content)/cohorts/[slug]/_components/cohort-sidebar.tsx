'use client'

import type { ParsedUrlQuery } from 'querystring'
import React, { useRef } from 'react'
import Link from 'next/link'
import { Certificate } from '@/app/(content)/_components/cohort-certificate-container'
import { ModuleProgressProvider } from '@/app/(content)/_components/module-progress-provider'
import { WorkshopNavigationProvider } from '@/app/(content)/workshops/_components/workshop-navigation-provider'
import { CldImage } from '@/components/cld-image'
import type { Cohort } from '@/lib/cohort'
import { getModuleProgressForUser } from '@/lib/progress'
import type { Workshop } from '@/lib/workshops'
import { getCachedWorkshopNavigation } from '@/lib/workshops-query'
import { cn } from '@/utils/cn'
import { formatCohortDateRange } from '@/utils/format-cohort-date'
import { differenceInCalendarDays } from 'date-fns'
import { useInView, useMotionValueEvent, useScroll } from 'framer-motion'
import { Construction } from 'lucide-react'
import { useMeasure } from 'react-use'

import type { Coupon } from '@coursebuilder/core/schemas'
import type { CouponForCode } from '@coursebuilder/core/types'
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
	Alert,
	AlertTitle,
	Button,
} from '@coursebuilder/ui'
import { getResourcePath } from '@coursebuilder/utils-resource/resource-paths'

import { WorkshopLessonList } from './cohort-list/workshop-lesson-list'
import type { CohortPageProps } from './cohort-page-props'
import { CohortPricingWidgetContainer } from './cohort-pricing-widget-container'

export const CohortSidebar = ({
	sticky = true,
	hasPurchasedCurrentProduct,
	loyaltyCoupon,
	cohort,
	allowPurchase,
	workshops,
	hasCompletedCohort,
	cohortProps,
	searchParams,
}: {
	sticky?: boolean
	cohort: Cohort
	hasPurchasedCurrentProduct?: boolean
	loyaltyCoupon?: CouponForCode
	allowPurchase?: boolean
	workshops?: Workshop[]
	hasCompletedCohort?: boolean
	cohortProps?: CohortPageProps
	searchParams?: ParsedUrlQuery
}) => {
	const [sidebarRef, { height }] = useMeasure<HTMLDivElement>()
	const [windowHeight, setWindowHeight] = React.useState(0)
	const buySectionRef = useRef<HTMLDivElement>(null)
	const isInView = useInView(buySectionRef, { margin: '0px 0px 0% 0px' })

	React.useEffect(() => {
		const handleResize = () => {
			setWindowHeight(window.innerHeight)
			// Reset initial height on resize so it recalculates
			setInitialHeight(null)
		}
		handleResize()
		window.addEventListener('resize', handleResize)

		return () => {
			window.removeEventListener('resize', handleResize)
		}
	}, [])

	// Always sticky when enabled, just determine if we need to minify
	const isScrolling = sticky
	const [shouldMinify, setShouldMinify] = React.useState(false)
	const [initialHeight, setInitialHeight] = React.useState<number | null>(null)

	React.useEffect(() => {
		if (!windowHeight || !height) return

		// Use initial height (when not minified) for decision making to prevent feedback loop
		if (initialHeight === null) {
			setInitialHeight(height)
		}

		const heightForDecision = initialHeight || height
		const availableHeight = windowHeight - 48 // Account for top margin
		const contentFits = availableHeight > heightForDecision

		// Only minify if content doesn't fit
		setShouldMinify(sticky && !contentFits)
	}, [sticky, height, windowHeight, initialHeight])

	const { fields } = cohort
	const PT = fields.timezone || 'America/Los_Angeles'
	// Parse cohort start date once for day calculation
	const cohortStartDate = fields.startsAt ? new Date(fields.startsAt) : null

	const { scrollY, scrollYProgress } = useScroll()
	const [isMinified, setIsMinified] = React.useState(false)
	const [currentScrollY, setCurrentScrollY] = React.useState(0)
	const [currentScrollYProgress, setCurrentScrollYProgress] = React.useState(0)

	useMotionValueEvent(scrollY, 'change', (latest: number) => {
		setCurrentScrollY(latest)
	})

	useMotionValueEvent(scrollYProgress, 'change', (latest: number) => {
		setCurrentScrollYProgress(latest)
	})

	React.useEffect(() => {
		if (shouldMinify) {
			// Near bottom of page: expand content even if normally minified
			if (currentScrollYProgress > 0.95) {
				setIsMinified(false)
			} else {
				// Content doesn't fit: minify on scroll to help it fit
				setIsMinified(currentScrollY > 60)
			}
		} else {
			// Content fits: keep full content - no minification
			setIsMinified(false)
		}
	}, [shouldMinify, currentScrollY, currentScrollYProgress])

	if (!cohortProps) {
		return null
	}
	return (
		<>
			<div
				ref={buySectionRef}
				id="buy"
				className="relative flex w-full flex-col gap-3 md:max-w-sm"
			>
				<div
					ref={sidebarRef}
					className={cn(
						'dark:bg-muted-foreground/5 rounded-lg border bg-white shadow-[0px_4px_38px_-14px_rgba(0,_0,_0,_0.1)] dark:border-transparent',
						{
							'top-3 md:sticky': isScrolling,
						},
					)}
				>
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
								{workshops && workshops.length === 0 ? (
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
										{workshops &&
											workshops.map((workshop, index) => {
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
									isCompleted={hasCompletedCohort || false}
									resourceSlugOrId={cohort.fields?.slug}
								/>
							</div>
						</div>
					) : allowPurchase ? (
						<CohortPricingWidgetContainer
							{...cohortProps}
							isMinified={isMinified}
							couponFromCode={
								loyaltyCoupon ? loyaltyCoupon : cohortProps.couponFromCode
							}
							couponIdFromCoupon={
								loyaltyCoupon
									? loyaltyCoupon.id
									: cohortProps.couponIdFromCoupon
							}
							searchParams={searchParams}
							isScrolling={isScrolling}
						/>
					) : null}
				</div>
			</div>
			<CohortSidebarMobile
				className={cn({
					'pointer-events-none opacity-0': isInView,
				})}
				cohort={cohort}
			/>
		</>
	)
}

export const CohortSidebarMobile = ({
	cohort,
	className,
}: {
	cohort: Cohort
	className?: string
}) => {
	const { fields } = cohort
	const { startsAt, endsAt, timezone } = fields

	const { dateString: eventDateString, timeString: eventTimeString } =
		formatCohortDateRange(startsAt, endsAt, timezone)

	const handleScrollToBuy = (e: React.MouseEvent<HTMLAnchorElement>) => {
		e.preventDefault()
		const buySection = document.getElementById('buy')
		buySection?.scrollIntoView({
			behavior: 'smooth',
			block: 'start',
		})
	}

	return (
		<div
			className={cn(
				'bg-background/90 backdrop-blur-xs fixed bottom-0 left-0 z-20 flex w-full items-center justify-between border-t px-5 py-3 shadow-[0px_-8px_38px_-14px_rgba(0,_0,_0,_0.1)] transition-opacity duration-300 md:hidden',
				className,
			)}
		>
			<p className="font-heading text-sm font-medium">{eventDateString}</p>
			<Button asChild>
				<Link
					className="dark:bg-primary font-heading dark:hover:bg-primary/90 from-primary relative cursor-pointer rounded-lg bg-gradient-to-b to-indigo-800 text-base font-semibold tracking-tight shadow-xl transition duration-300 ease-out hover:bg-blue-700 hover:brightness-110"
					href="#buy"
					onClick={handleScrollToBuy}
				>
					<span className="relative z-10 drop-shadow-md dark:text-white">
						Enroll
					</span>
					<div
						style={{
							backgroundSize: '200% 100%',
							animationDuration: '2s',
							animationIterationCount: 'infinite',
							animationTimingFunction: 'linear',
							animationFillMode: 'forwards',
							animationDelay: '2s',
						}}
						className="animate-shine absolute inset-0 bg-[linear-gradient(120deg,rgba(255,255,255,0)40%,rgba(255,255,255,1)50%,rgba(255,255,255,0)60%)] opacity-10 dark:opacity-20"
					/>
				</Link>
			</Button>
		</div>
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
