'use client'

import type { ParsedUrlQuery } from 'querystring'
import * as React from 'react'
import { PricingWidget } from '@/app/(content)/workshops/_components/pricing-widget'
import { CldImage } from '@/components/cld-image'
import type { ProductPricingFeature } from '@/components/commerce/product-pricing-features'
import { SubscribeToConvertkitForm } from '@/convertkit'
import { env } from '@/env.mjs'
import { track } from '@/utils/analytics'
import { formatInTimeZone } from 'date-fns-tz'
import { toSnakeCase } from 'drizzle-orm/casing'
import { CheckCircle } from 'lucide-react'

import type { PricingOptions } from '@coursebuilder/core/types'
import { cn } from '@coursebuilder/ui/utils/cn'

import type { EventPageProps } from './event-page-props'

type EnrollmentState =
	| { type: 'open' }
	| { type: 'not-open'; title: string; subtitle: string }
	| { type: 'closed'; title: string; subtitle: string }

/**
 * Props for EventPricingWidgetContainer, extending EventPageProps with
 * customization hooks for rendering overrides.
 */
export type EventPricingWidgetContainerProps = EventPageProps & {
	className?: string
	searchParams?: ParsedUrlQuery
	/** Custom features to prepend to the default feature list */
	prependFeatures?: ProductPricingFeature[]
	/** Custom content for the buy button */
	buyButtonContent?: React.ReactNode
	/** Additional className for the buy button */
	buyButtonClassName?: string
	/** Hide the default product features section */
	hideFeatures?: boolean
	/** Override for the waitlist form */
	renderWaitlistForm?: () => React.ReactNode
	/** Override for the header image */
	renderImage?: () => React.ReactNode
	/** Override for the event date display */
	renderEventDate?: (dateString: string, timeString: string) => React.ReactNode
	/** Override pricingWidgetOptions at container level */
	pricingWidgetOptionsOverride?: Partial<PricingOptions>
}

/**
 * Formats event date range for display, handling timezone conversion.
 */
function formatEventDateRange(
	startsAt: string | null | undefined,
	endsAt: string | null | undefined,
	timezone: string = 'America/Los_Angeles',
): { dateString: string; timeString: string } {
	if (!startsAt) {
		return { dateString: '', timeString: '' }
	}

	const startDate = new Date(startsAt)
	const dateString = formatInTimeZone(startDate, timezone, 'MMMM do, yyyy')

	if (!endsAt) {
		const timeString = formatInTimeZone(startDate, timezone, 'h:mm a zzz')
		return { dateString, timeString }
	}

	const endDate = new Date(endsAt)
	const timeString = `${formatInTimeZone(startDate, timezone, 'h:mm a')} — ${formatInTimeZone(endDate, timezone, 'h:mm a zzz')}`

	return { dateString, timeString }
}

/**
 * Container for event pricing widget with enrollment state management,
 * waitlist support, and extensive customization options.
 *
 * Mirrors the structure of CohortPricingWidgetContainer for consistency.
 */
export const EventPricingWidgetContainer: React.FC<
	EventPricingWidgetContainerProps
> = ({
	className,
	searchParams,
	prependFeatures,
	buyButtonContent,
	buyButtonClassName,
	hideFeatures,
	renderWaitlistForm: renderWaitlistFormProp,
	renderImage: renderImageProp,
	renderEventDate,
	pricingWidgetOptionsOverride,
	...props
}) => {
	const {
		event,
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

	const { fields } = event
	const { startsAt, endsAt, timezone = 'America/Los_Angeles' } = fields
	const product = products && products[0]
	const { allowPurchase } = searchParams || {}

	// Timezone-aware date comparison
	const nowInTz = new Date(
		formatInTimeZone(new Date(), timezone, "yyyy-MM-dd'T'HH:mm:ssXXX"),
	)
	const isUpcoming = startsAt ? new Date(startsAt) > nowInTz : false
	const hasStarted = startsAt ? new Date(startsAt) <= nowInTz : false

	// Format event date and time
	const { dateString: eventDateString, timeString: eventTimeString } =
		formatEventDateRange(startsAt, endsAt, timezone)

	// Waitlist ConvertKit fields
	const waitlistCkFields = {
		[`waitlist_${toSnakeCase(product?.name || 'event')}`]: new Date()
			.toISOString()
			.slice(0, 10),
	}

	/**
	 * Determines the current enrollment state based on event timing
	 * and product configuration.
	 */
	const getEnrollmentState = (): EnrollmentState => {
		// Bypass if coupon allows it
		if (couponFromCode?.fields?.bypassSoldOut === true) {
			return { type: 'open' }
		}

		// Events are simpler than cohorts - they're open if upcoming
		if (isUpcoming) {
			return { type: 'open' }
		}

		// Event has already started
		return {
			type: 'closed',
			title: hasStarted ? 'This event has already started' : 'Event has passed',
			subtitle: hasStarted
				? 'Join the waitlist to be notified about future events.'
				: 'This event has ended. Join the waitlist to be notified about future events.',
		}
	}

	const enrollmentState = getEnrollmentState()

	// Default image renderer
	const renderImage = () => {
		if (renderImageProp) {
			return renderImageProp()
		}

		if (
			!pricingWidgetOptions?.withImage &&
			!pricingWidgetOptionsOverride?.withImage
		) {
			return null
		}

		return (
			<div className="mb-3 flex w-full items-center justify-center">
				<CldImage
					loading="lazy"
					src="https://res.cloudinary.com/total-typescript/image/upload/v1741008166/aihero.dev/assets/textured-logo-mark_2x_ecauns.png"
					alt=""
					aria-hidden="true"
					width={130}
					height={130}
					className="rotate-12"
				/>
			</div>
		)
	}

	// Default waitlist form renderer
	const renderWaitlistForm = () => {
		if (renderWaitlistFormProp) {
			return renderWaitlistFormProp()
		}

		return (
			<SubscribeToConvertkitForm
				fields={waitlistCkFields}
				actionLabel="Join Waitlist"
				className="relative z-10 mt-5 flex w-full flex-col items-center justify-center gap-2 [&_button]:mt-1 [&_button]:h-12 [&_button]:w-full [&_button]:text-base [&_input]:h-12 [&_input]:text-lg"
				successMessage={
					<p className="inline-flex items-center text-center text-lg font-medium">
						<CheckCircle className="text-primary mr-2 size-5" /> You're on the
						waitlist
					</p>
				}
				onSuccess={(subscriber, email) => {
					if (subscriber && product) {
						track('waitlist_joined', {
							product_name: product.name,
							product_id: product.id,
							email: email,
						})
					}
				}}
			/>
		)
	}

	// Exit early if no valid product
	if (!product || product.status !== 1) {
		return null
	}

	// Merge pricing options: base defaults < props < container override
	const mergedPricingOptions: Partial<PricingOptions> = {
		withTitle: false,
		withImage: false,
		withGuaranteeBadge: false,
		isLiveEvent: true,
		teamQuantityLimit:
			quantityAvailable >= 0 && quantityAvailable > 5
				? 5
				: quantityAvailable < 0
					? 100
					: quantityAvailable,
		isPPPEnabled: false,
		cancelUrl: `${env.NEXT_PUBLIC_URL}/events/${event.fields?.slug || event.id}`,
		...pricingWidgetOptions,
		...pricingWidgetOptionsOverride,
	}

	return (
		<>
			{enrollmentState.type === 'open' || allowPurchase ? (
				<div className={cn('px-5 pb-5', className)}>
					{renderImage()}
					{eventDateString && (
						<div className="flex w-full items-center justify-center pt-5 text-center text-sm opacity-80">
							{renderEventDate
								? renderEventDate(eventDateString, eventTimeString)
								: eventDateString}
						</div>
					)}
					<PricingWidget
						className="border-b-0"
						product={product}
						quantityAvailable={quantityAvailable}
						commerceProps={{ ...commerceProps, products, couponFromCode }}
						pricingDataLoader={pricingDataLoader}
						prependFeatures={prependFeatures}
						pricingWidgetOptions={mergedPricingOptions}
						buyButtonContent={buyButtonContent}
						buyButtonClassName={buyButtonClassName}
						hideFeatures={hideFeatures}
					/>
				</div>
			) : (
				<>
					{renderImage()}
					{eventDateString && (
						<div className="-mb-3 flex w-full items-center justify-center pt-5 text-center text-sm opacity-80">
							{renderEventDate
								? renderEventDate(eventDateString, eventTimeString)
								: eventDateString}
						</div>
					)}
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
