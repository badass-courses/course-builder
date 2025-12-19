'use client'

import * as React from 'react'
import { SubscribeToConvertkitForm } from '@/convertkit'
import { env } from '@/env.mjs'
import { track } from '@/utils/analytics'
import { toSnakeCase } from 'drizzle-orm/casing'
import { useInView } from 'framer-motion'
import { CheckCircle } from 'lucide-react'

import { PriceCheckProvider } from '@coursebuilder/commerce-next/pricing/pricing-check-context'
import type { Product, Purchase } from '@coursebuilder/core/schemas'
import type { CommerceProps } from '@coursebuilder/core/types'
import { Button } from '@coursebuilder/ui'
import { cn } from '@coursebuilder/ui/utils/cn'

import { PricingWidget } from './pricing-widget'
import type { PricingData, PricingWidgetOptions } from './types'
import { useEnrollmentState } from './use-enrollment-state'

/**
 * Base pricing data that gets resolved from the loader promise.
 * Supports both `product` (singular) and `products` (array) for compatibility.
 */
export type ResourcePricingData = {
	product?: Product | null
	products?: Product[]
	pricingDataLoader: Promise<PricingData>
	quantityAvailable: number
	hasPurchasedCurrentProduct?: boolean
	purchases?: Purchase[]
	couponFromCode?: CommerceProps['couponFromCode']
} & Omit<CommerceProps, 'products'>

type EnrollmentConfig = {
	startsAt?: string | null
	endsAt?: string | null
	timezone?: string | null
}

type WaitlistConfig = {
	enabled: boolean
}

type MobileCtaConfigObject = {
	/** Primary text (e.g., date string) */
	title: string
	/** Secondary text (e.g., time) */
	subtitle?: string
	/** Button text */
	buttonText?: string
	/** Button href */
	buttonHref?: string
}

/** Mobile CTA can be either a config object or custom ReactNode */
type MobileCtaConfig = MobileCtaConfigObject | React.ReactNode

export type ResourcePricingWidgetProps = {
	/** Resource type for URL generation */
	resourceType: 'event' | 'cohort' | 'workshop'
	/** Resource slug for cancel URL */
	resourceSlug: string
	/** Pricing data loader promise - resolved with React.use() */
	pricingDataLoader: Promise<ResourcePricingData>
	/** Pricing widget options */
	options?: Partial<PricingWidgetOptions>
	/** CTA button label */
	ctaLabel?: string
	/** Workshops list for features */
	workshops?: { title: string; slug: string }[]
	/** Enrollment config for cohorts/events */
	enrollment?: EnrollmentConfig
	/** Waitlist config - shows waitlist form when enrollment is closed */
	waitlist?: WaitlistConfig
	/** Mobile CTA config */
	mobileCta?: MobileCtaConfig
	/** Children rendered when purchased */
	children?: React.ReactNode
	/** Additional CSS classes */
	className?: string
}

/**
 * Unified pricing widget for resource landing pages.
 *
 * Handles:
 * - PriceCheckProvider wrapper
 * - Enrollment state (open/closed/started) for live products
 * - Waitlist form when enrollment is closed
 * - Mobile floating CTA with scroll visibility
 * - Purchased state (renders children)
 *
 * Uses React.use() for streaming with Suspense.
 */
export function ResourcePricingWidget({
	resourceType,
	resourceSlug,
	pricingDataLoader,
	options = {},
	ctaLabel,
	workshops = [],
	enrollment,
	waitlist,
	mobileCta,
	children,
	className,
}: ResourcePricingWidgetProps) {
	// Resolve the pricing data promise
	const pricingData = React.use(pricingDataLoader)
	const {
		product: singleProduct,
		products,
		pricingDataLoader: innerPricingDataLoader,
		quantityAvailable,
		hasPurchasedCurrentProduct,
		couponFromCode,
		purchases,
		allowPurchase,
		...commerceProps
	} = pricingData

	// Support both product (singular) and products (array)
	const product = singleProduct || (products && products[0])

	const purchasedProductIds =
		purchases?.map((purchase) => purchase.productId) || []
	const ref = React.useRef<HTMLDivElement>(null)
	const isInView = useInView(ref, { margin: '0px 0px 0% 0px' })

	// Enrollment state for cohorts/events
	const enrollmentState = useEnrollmentState({
		product: product || undefined,
		startsAt: enrollment?.startsAt,
		endsAt: enrollment?.endsAt,
		timezone: enrollment?.timezone || undefined,
		bypassSoldOut: couponFromCode?.fields?.bypassSoldOut === true,
	})

	// Waitlist form fields
	const waitlistCkFields =
		waitlist?.enabled && product
			? {
					[`waitlist_${toSnakeCase(product.name)}`]: new Date()
						.toISOString()
						.slice(0, 10),
				}
			: {}

	const cancelUrl = `${env.NEXT_PUBLIC_URL}/${resourceType}s/${resourceSlug}`

	// Merge options with defaults based on resource type
	const mergedOptions: Partial<PricingWidgetOptions> = {
		withTitle: false,
		withImage: false,
		withGuaranteeBadge: resourceType === 'workshop',
		isLiveEvent: resourceType === 'event' || resourceType === 'cohort',
		isCohort: resourceType === 'cohort',
		isPPPEnabled: resourceType === 'workshop',
		allowTeamPurchase: true,
		teamQuantityLimit:
			resourceType === 'event'
				? quantityAvailable >= 0 && quantityAvailable > 5
					? 5
					: quantityAvailable < 0
						? 100
						: quantityAvailable
				: 100,
		cancelUrl,
		...options,
	}

	// Default CTA labels
	const defaultCtaLabel =
		resourceType === 'cohort'
			? 'Enroll'
			: resourceType === 'event'
				? 'Reserve Your Spot'
				: 'Buy Now'

	// Check if product is active and upcoming (for events)
	const isUpcoming = enrollment?.startsAt
		? new Date(enrollment.startsAt) > new Date()
		: true
	const isProductActive = product?.status === 1

	// No product
	if (!product) {
		return null
	}

	// Purchased state - render children
	if (hasPurchasedCurrentProduct) {
		return <>{children}</>
	}

	// Product not active or event already passed
	if (!isProductActive || (resourceType === 'event' && !isUpcoming)) {
		return null
	}

	// For cohorts: check enrollment state. Events don't have enrollment windows.
	const isEnrollmentOpen =
		resourceType === 'event' ||
		!enrollment ||
		enrollmentState.type === 'open' ||
		allowPurchase

	// Render waitlist form
	const renderWaitlistForm = () => {
		if (!waitlist?.enabled || !product) return null

		return (
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
					if (subscriber) {
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

	// Helper to check if mobileCta is a config object
	const isMobileCtaConfig = (
		cta: MobileCtaConfig,
	): cta is MobileCtaConfigObject => {
		return (
			typeof cta === 'object' &&
			cta !== null &&
			'title' in cta &&
			typeof (cta as MobileCtaConfigObject).title === 'string'
		)
	}

	// Render mobile CTA
	const renderMobileCta = () => {
		if (!mobileCta) return null

		// Custom ReactNode passed directly
		if (!isMobileCtaConfig(mobileCta)) {
			return (
				<div
					className={cn(
						'bg-background/80 backdrop-blur-xs fixed bottom-5 left-5 right-5 z-50 flex gap-2 rounded-lg border p-4 shadow-xl transition duration-150 ease-in-out lg:hidden',
						{ 'opacity-0': isInView },
					)}
				>
					{mobileCta}
				</div>
			)
		}

		// Config object
		return (
			<div
				className={cn(
					'bg-background/80 backdrop-blur-xs fixed bottom-5 left-5 right-5 z-50 flex gap-2 rounded-lg border p-4 shadow-xl transition duration-150 ease-in-out lg:hidden',
					{ 'opacity-0': isInView },
				)}
			>
				<div className="flex w-full flex-row justify-between gap-2 text-sm">
					<div className="flex flex-col gap-1">
						<div className="font-medium">{mobileCta.title}</div>
						{mobileCta.subtitle && (
							<div className="text-muted-foreground">{mobileCta.subtitle}</div>
						)}
					</div>
					<Button variant="secondary" asChild>
						<a href={mobileCta.buttonHref || '#buy'}>
							{mobileCta.buttonText || 'Buy Now'}
						</a>
					</Button>
				</div>
			</div>
		)
	}

	return (
		<div ref={ref} className={cn('py-5', className)}>
			{isEnrollmentOpen ? (
				<PriceCheckProvider purchasedProductIds={purchasedProductIds}>
					<PricingWidget
						className="border-b-0"
						product={product}
						commerceProps={{ ...commerceProps, products: [product] }}
						pricingDataLoader={innerPricingDataLoader}
						quantityAvailable={quantityAvailable}
						hasPurchasedCurrentProduct={hasPurchasedCurrentProduct}
						ctaLabel={ctaLabel || defaultCtaLabel}
						workshops={workshops}
						options={mergedOptions}
					/>
					{renderMobileCta()}
				</PriceCheckProvider>
			) : (
				// Enrollment closed - show waitlist
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
			)}
		</div>
	)
}
