'use client'

import * as React from 'react'
import type { ProductPricingFeature } from '@/components/commerce/product-pricing-features'
import { SubscribeToConvertkitForm } from '@/convertkit'
import { env } from '@/env.mjs'
import { track } from '@/utils/analytics'
import { formatInTimeZone } from 'date-fns-tz'
import { toSnakeCase } from 'drizzle-orm/casing'
import { CheckCircle } from 'lucide-react'

import { cn } from '@coursebuilder/ui/utils/cn'

import { PricingWidget } from './pricing-widget'
import type { WorkshopPageProps } from './workshop-page-props'

/** Polling interval for seat availability (5 seconds) */
const AVAILABILITY_POLL_INTERVAL = 5000

export const WorkshopPricingWidgetContainer: React.FC<
	WorkshopPageProps & {
		className?: string
		searchParams?: { [key: string]: string | string[] | undefined }
		workshops?: {
			title: string
			slug: string
		}[]
		prependFeatures?: ProductPricingFeature[]
		pricingWidgetOptions?: any
		pathname?: string
	}
> = ({
	className,
	searchParams,
	workshops,
	prependFeatures,
	pricingWidgetOptions,
	pathname,
	...props
}) => {
	const {
		product,
		quantityAvailable: initialQuantityAvailable,
		pricingDataLoader,
		hasPurchasedCurrentProduct,
		...commerceProps
	} = props
	const couponFromCode = commerceProps?.couponFromCode
	const { allowPurchase } = searchParams || {}

	// Track current availability with polling for live events
	const [currentQuantityAvailable, setCurrentQuantityAvailable] =
		React.useState(initialQuantityAvailable)

	const isLiveEvent = product?.type === 'live'
	const hasLimitedSeats = initialQuantityAvailable !== -1

	// Poll for seat availability on products with limited seats
	React.useEffect(() => {
		if (!hasLimitedSeats || !product?.id) {
			return
		}

		const checkAvailability = async () => {
			try {
				const response = await fetch(`/api/products/${product.id}/availability`)
				if (response.ok) {
					const data = await response.json()
					if (typeof data.quantityAvailable === 'number') {
						setCurrentQuantityAvailable(data.quantityAvailable)
					}
				}
			} catch (error) {
				// Silently fail - we'll try again on next interval
			}
		}

		// Initial check after mount
		const initialTimeout = setTimeout(checkAvailability, 1000)

		// Set up polling interval
		const intervalId = setInterval(
			checkAvailability,
			AVAILABILITY_POLL_INTERVAL,
		)

		return () => {
			clearTimeout(initialTimeout)
			clearInterval(intervalId)
		}
	}, [hasLimitedSeats, product?.id])

	// Get current time in PT for comparison
	const tz = 'America/Los_Angeles'
	const nowInPT = new Date(
		formatInTimeZone(new Date(), tz, "yyyy-MM-dd'T'HH:mm:ssXXX"),
	)

	// Check enrollment status from product fields
	const { openEnrollment, closeEnrollment } = product?.fields || {}

	const isOpenEnrollment = openEnrollment
		? new Date(openEnrollment) < nowInPT &&
			(closeEnrollment ? new Date(closeEnrollment) > nowInPT : true)
		: true // Default to open if no enrollment dates set

	// Check if enrollment hasn't opened yet
	const enrollmentNotOpenYet = openEnrollment
		? new Date(openEnrollment) > nowInPT
		: false

	// Check if sold out (any product with limited seats) - uses polled value
	const isSoldOut =
		hasLimitedSeats &&
		currentQuantityAvailable <= 0 &&
		!couponFromCode?.fields?.bypassSoldOut

	// Determine enrollment state
	const getEnrollmentState = () => {
		// Bypass sold out if coupon allows
		if (couponFromCode?.fields?.bypassSoldOut === true) {
			return { type: 'open' as const }
		}

		// Check sold out first
		if (isSoldOut) {
			return {
				type: 'sold-out' as const,
				title: 'Sold Out',
				subtitle: 'Join the waitlist to be notified if spots become available.',
			}
		}

		// Check enrollment dates
		if (isOpenEnrollment) {
			return { type: 'open' as const }
		}

		if (enrollmentNotOpenYet) {
			const enrollmentOpenDateString = openEnrollment
				? formatInTimeZone(
						new Date(openEnrollment),
						tz,
						"MMM dd, yyyy 'at' h:mm a zzz",
					)
				: null

			return {
				type: 'not-open' as const,
				title: `Enrollment opens ${enrollmentOpenDateString}`,
				subtitle: 'Join the waitlist to be notified when enrollment opens.',
			}
		}

		// Enrollment is closed
		return {
			type: 'closed' as const,
			title: 'Enrollment is closed',
			subtitle: 'Join the waitlist to be notified when enrollment opens again.',
		}
	}

	const enrollmentState = getEnrollmentState()

	// Waitlist form fields
	const waitlistCkFields = {
		[`waitlist_${toSnakeCase(product?.name || '')}`]: new Date()
			.toISOString()
			.slice(0, 10),
	}

	const renderWaitlistForm = () => (
		<SubscribeToConvertkitForm
			fields={waitlistCkFields}
			actionLabel="Join Waitlist"
			className="relative z-10 mt-5 flex w-full flex-col items-center justify-center gap-2 [&_button]:mt-1 [&_button]:h-12 [&_button]:w-full [&_button]:text-base [&_input]:h-12 [&_input]:text-lg"
			successMessage={
				<p className="inline-flex items-center text-center text-lg font-medium">
					<CheckCircle className="text-primary mr-2 size-5" /> You are on the
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

	if (!product || product.status !== 1) {
		return null
	}

	// Don't show if product is not published (unless bypass is set)
	if (product.fields.state !== 'published' && !allowPurchase) {
		return null
	}

	const cancelUrl = pathname ? `${env.NEXT_PUBLIC_URL}${pathname}` : ''

	return (
		<>
			{enrollmentState.type === 'open' || allowPurchase ? (
				<div className={cn('px-5', className)}>
					<PricingWidget
						workshops={workshops}
						product={product}
						quantityAvailable={currentQuantityAvailable}
						commerceProps={{ ...commerceProps, products: [product] }}
						pricingDataLoader={pricingDataLoader}
						hasPurchasedCurrentProduct={hasPurchasedCurrentProduct}
						prependFeatures={prependFeatures}
						pricingWidgetOptions={{
							withImage: false,
							withGuaranteeBadge: true,
							isLiveEvent: product.type === 'live',
							isCohort: product.type === 'cohort',
							isPPPEnabled: true,
							cancelUrl,
							...pricingWidgetOptions,
						}}
					/>
				</div>
			) : (
				<div className={cn('p-5', className)}>
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
			)}
		</>
	)
}
