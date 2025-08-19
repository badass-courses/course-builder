'use client'

import type { ParsedUrlQuery } from 'querystring'
import * as React from 'react'
import { PricingWidget } from '@/app/(content)/workshops/_components/pricing-widget'
import { CldImage } from '@/components/cld-image'
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
				<CldImage
					loading="lazy"
					src="https://res.cloudinary.com/total-typescript/image/upload/v1741008166/aihero.dev/assets/textured-logo-mark_2x_ecauns.png"
					alt=""
					aria-hidden="true"
					width={130}
					height={130}
					className=""
				/>
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
