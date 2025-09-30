'use client'

import type { ParsedUrlQuery } from 'querystring'
import * as React from 'react'
import { PricingWidget } from '@/app/(content)/workshops/_components/pricing-widget'
import { SubscribeToConvertkitForm } from '@/convertkit'
import { env } from '@/env.mjs'
import { track } from '@/utils/analytics'
import { formatCohortDateRange } from '@/utils/format-cohort-date'
import { formatInTimeZone } from 'date-fns-tz'
import { toSnakeCase } from 'drizzle-orm/casing'
import { CheckCircle } from 'lucide-react'

import { cn } from '@coursebuilder/ui/utils/cn'

import type { CohortPageProps } from './cohort-page-props'

export const CohortPricingWidgetContainer: React.FC<
	CohortPageProps & { className?: string; searchParams?: ParsedUrlQuery }
> = ({ className, searchParams, ...props }) => {
	const {
		cohort,
		mdx,
		products,
		quantityAvailable,
		purchaseCount,
		totalQuantity,
		pricingDataLoader,
		hasPurchasedCurrentProduct,
		pricingWidgetOptions,
		couponFromCode,
		...commerceProps
	} = props

	const { fields } = cohort
	const { startsAt, endsAt, timezone } = fields
	const product = products && products[0]
	const { openEnrollment, closeEnrollment } = product?.fields || {}
	const { allowPurchase } = searchParams || {}
	// Properly handle timezone comparison - get current time in PT to compare with PT stored date
	const tz = timezone || 'America/Los_Angeles'
	const nowInPT = new Date(
		formatInTimeZone(new Date(), tz, "yyyy-MM-dd'T'HH:mm:ssXXX"),
	)
	const isUpcoming = startsAt ? new Date(startsAt) > nowInPT : false

	const isOpenEnrollment = openEnrollment
		? new Date(openEnrollment) < nowInPT &&
			(closeEnrollment ? new Date(closeEnrollment) > nowInPT : true)
		: false

	// Check if enrollment hasn't opened yet
	const enrollmentNotOpenYet = openEnrollment
		? new Date(openEnrollment) > nowInPT
		: false

	// Check if cohort has actually started (different from enrollment status)
	const hasStarted = startsAt ? new Date(startsAt) <= nowInPT : false

	const workshops = cohort?.resources?.map(({ resource }) => ({
		title: resource.fields.title,
		slug: resource.fields.slug,
	}))
	const waitlistCkFields = {
		// example: waitlist_mcp_workshop_ticket: "2025-04-17"
		[`waitlist_${toSnakeCase(product?.name || '')}`]: new Date()
			.toISOString()
			.slice(0, 10),
	}

	const { dateString: eventDateString, timeString: eventTimeString } =
		formatCohortDateRange(startsAt, endsAt, timezone)

	// Format enrollment open date
	const enrollmentOpenDateString = openEnrollment
		? formatInTimeZone(
				new Date(openEnrollment),
				tz,
				"MMM dd, yyyy 'at' h:mm a zzz",
			)
		: null

	// Determine the current state and messaging
	const getEnrollmentState = () => {
		if (couponFromCode?.fields?.bypassSoldOut === true) {
			return { type: 'open' as const }
		}
		if (isOpenEnrollment) {
			return { type: 'open' as const }
		}
		if (enrollmentNotOpenYet) {
			return {
				type: 'not-open' as const,
				title: `Enrollment opens ${enrollmentOpenDateString}`,
				subtitle: 'Join the waitlist to be notified when enrollment opens.',
			}
		}
		// Enrollment is closed
		return {
			type: 'closed' as const,
			title: hasStarted
				? 'This cohort has already started'
				: 'Enrollment is closed',
			subtitle: hasStarted
				? 'You can still join the waitlist to be notified when the next cohort starts.'
				: 'Enrollment has closed for this cohort. Join the waitlist to be notified when the next cohort starts.',
		}
	}

	const enrollmentState = getEnrollmentState()

	// Shared components
	const renderImage = () => {
		if (!pricingWidgetOptions?.withImage) return null
		return (
			<div className="mb-3 flex w-full items-center justify-center">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					className="dark:text-primary/30 size-20 text-violet-300"
					fill="none"
					viewBox="0 0 102 119"
				>
					<path
						fill="url(#a)"
						d="M81.787 57.543c.923-1.467-.109-3.37-1.793-3.37H57.769a.795.795 0 0 1-.745-1.07l18.35-49.68C76.3.976 72.93-.708 71.518 1.465L21.092 78.3c-.924 1.467.108 3.369 1.793 3.369h21.938c.692 0 1.172.69.931 1.338l-7.288 19.679c-.802 2.165-3.223 3.286-5.293 2.262-13.657-6.75-23.058-20.793-23.058-37.027 0-21.602 16.694-39.394 37.917-41.157a.806.806 0 0 0 .607-.357l5.489-8.332a.397.397 0 0 0-.311-.615 45.6 45.6 0 0 0-2.35-.073c-28.528 0-51.621 23.746-50.48 52.545.913 23.53 18.13 43.075 40.627 47.56a1.18 1.18 0 0 0 1.212-.512L81.84 57.543h-.054Z"
					/>
					<path
						fill="currentColor"
						d="M74.433 22.967a.4.4 0 0 0-.583.2l-2.862 7.807a.604.604 0 0 0 .278.734c12.792 7.03 21.496 20.64 21.496 36.213 0 15.613-16.643 39.228-37.72 41.141a1.22 1.22 0 0 0-.911.539l-5.266 7.991a.58.58 0 0 0 .393.9C72.085 121.844 102 97.553 102 67.922c0-14.633-5.902-31.625-27.567-44.955Z"
					/>
					<defs>
						<linearGradient
							id="a"
							x1=".962"
							x2="82.167"
							y1="59.063"
							y2="59.063"
							gradientUnits="userSpaceOnUse"
						>
							<stop stopColor="#8D63E9" />
							<stop offset="1" stopColor="#9D9CF9" />
						</linearGradient>
					</defs>
				</svg>
			</div>
		)
	}

	const renderWaitlistForm = () => (
		<SubscribeToConvertkitForm
			fields={waitlistCkFields}
			actionLabel="Join Waitlist"
			className="w-ful [&_button]:from-primary relative z-10 mt-5 flex flex-col items-center justify-center gap-2 [&_button]:mt-1 [&_button]:h-12 [&_button]:w-full [&_button]:cursor-pointer [&_button]:bg-gradient-to-b [&_button]:to-indigo-800 [&_button]:text-base [&_button]:shadow-md [&_input]:h-12 [&_input]:text-lg"
			successMessage={
				<p className="inline-flex items-center text-center text-lg font-medium">
					<CheckCircle className="text-primary mr-2 size-5" /> You are on the
					waitlist
				</p>
			}
			onSuccess={(subscriber, email) => {
				const handleOnSuccess = (subscriber: any) => {
					if (subscriber && product) {
						track('waitlist_joined', {
							product_name: product.name,
							product_id: product.id,
							email: email,
						})

						return subscriber
					}
				}
				handleOnSuccess(subscriber)
			}}
		/>
	)

	if (!product || product.status !== 1) {
		return null
	}

	return (
		<>
			{enrollmentState.type === 'open' || allowPurchase ? (
				<div className={cn('px-5 pb-5', className)}>
					{renderImage()}
					<p className="opacit-50 -mb-7 flex w-full items-center justify-center pt-5 text-center text-base">
						{eventDateString}
					</p>
					<PricingWidget
						className="border-b-0"
						workshops={workshops}
						product={product}
						quantityAvailable={quantityAvailable}
						commerceProps={commerceProps}
						pricingDataLoader={pricingDataLoader}
						pricingWidgetOptions={{
							cancelUrl: `${env.NEXT_PUBLIC_URL}/cohorts/${cohort.fields.slug}`,
							isCohort: true,
							isLiveEvent: true,
							withImage: false,
							withTitle: false,
							...pricingWidgetOptions,
						}}
					/>
				</div>
			) : (
				<>
					{renderImage()}
					<p className="opacit-50 -mb-3 flex w-full items-center justify-center pt-5 text-center text-sm">
						{eventDateString}
					</p>
					<div className="p-5">
						<div className="flex flex-col items-center justify-center gap-2 text-center">
							<p className="text-balance text-lg font-semibold">
								{enrollmentState.title}
							</p>
							<p className="text-foreground/80 text-balance text-sm">
								{enrollmentState.subtitle}
							</p>
						</div>
						{renderWaitlistForm()}
					</div>
				</>
			)}
		</>
	)
}
