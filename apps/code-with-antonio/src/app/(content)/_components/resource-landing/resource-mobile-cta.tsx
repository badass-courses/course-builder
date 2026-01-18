'use client'

import * as React from 'react'
import Link from 'next/link'
import { useModuleProgress } from '@/app/(content)/_components/module-progress-provider'
import { useContentNavigation } from '@/app/(content)/_components/navigation/provider'
import { Contributor } from '@/components/contributor'
import {
	flattenNavigationResources,
	getFirstResourceSlug,
} from '@/lib/content-navigation'

import * as Pricing from '@coursebuilder/commerce-next/pricing/pricing'
import type { Product } from '@coursebuilder/core/schemas'
import type { CommerceProps, PricingData } from '@coursebuilder/core/types'
import { Button } from '@coursebuilder/ui'
import { cn } from '@coursebuilder/ui/utils/cn'
import { getResourcePath } from '@coursebuilder/utils-resource/resource-paths'

/**
 * Mode for the mobile CTA display.
 * - 'pricing': Show price and buy button (direct to checkout)
 * - 'progress': Show continue/start watching button (purchased or free)
 * - 'custom': Render custom content via children
 */
export type MobileCtaMode = 'pricing' | 'progress' | 'custom'

/**
 * Base props shared by all mobile CTA variants.
 */
type BaseMobileCtaProps = {
	/** Additional CSS classes */
	className?: string
}

/**
 * Props for pricing mode - shows price and buy button.
 */
export type PricingMobileCtaProps = BaseMobileCtaProps & {
	mode: 'pricing'
	/** Resource/product title for display */
	title: string
	/** Product for pricing context */
	product: Product
	/** Pricing data loader promise */
	pricingDataLoader: Promise<PricingData>
	/** Commerce props for checkout */
	commerceProps: CommerceProps
	/** Cancel URL for Stripe checkout */
	cancelUrl: string
	/** Coupon ID if applicable */
	couponId?: string | null
	/** Custom CTA button text - defaults to "Buy Now" */
	ctaLabel?: string
}

/**
 * Props for progress mode - shows continue/start watching.
 */
export type ProgressMobileCtaProps = BaseMobileCtaProps & {
	mode: 'progress'
	/** Resource title for display */
	title: string
	/** Module type for URL generation (e.g., "workshop", "list") */
	moduleType: string
	/** Module slug for URL generation */
	moduleSlug: string
	/** Whether to show contributor info */
	showContributor?: boolean
}

/**
 * Props for custom mode - renders children directly.
 */
export type CustomMobileCtaProps = BaseMobileCtaProps & {
	mode: 'custom'
	/** Custom content to render */
	children: React.ReactNode
}

export type ResourceMobileCtaProps =
	| PricingMobileCtaProps
	| ProgressMobileCtaProps
	| CustomMobileCtaProps

/**
 * Mobile CTA bar for resource landing pages.
 *
 * Fixed at bottom of screen on mobile devices. Always visible - designed for
 * direct actions like checkout or navigation.
 *
 * Supports three modes:
 * - **pricing**: Shows price with discount info and direct Stripe checkout
 * - **progress**: Shows continue/start watching based on user progress
 * - **custom**: Renders custom content (e.g., schedule details for events)
 *
 * @example Pricing mode (direct checkout)
 * ```tsx
 * <ResourceMobileCta
 *   mode="pricing"
 *   title={workshop.title}
 *   product={product}
 *   pricingDataLoader={pricingDataLoader}
 *   commerceProps={commerceProps}
 *   cancelUrl={cancelUrl}
 * />
 * ```
 *
 * @example Progress mode (purchased or free content)
 * ```tsx
 * <ResourceMobileCta
 *   mode="progress"
 *   title={workshop.title}
 *   moduleType="workshop"
 *   moduleSlug={moduleSlug}
 * />
 * ```
 *
 * @example Custom mode (events with schedule)
 * ```tsx
 * <ResourceMobileCta mode="custom">
 *   <ResourceScheduleDetailsMobile schedule={schedule} />
 * </ResourceMobileCta>
 * ```
 */
export function ResourceMobileCta(props: ResourceMobileCtaProps) {
	const baseClassName = cn(
		'bg-background/90 backdrop-blur-xs fixed bottom-0 left-0 z-20 flex w-full items-center justify-between border-t px-5 py-3 md:hidden',
		props.className,
	)

	if (props.mode === 'pricing') {
		return (
			<div className={baseClassName}>
				<Pricing.Root
					className="w-full"
					product={props.product}
					couponId={props.couponId}
					country={props.commerceProps.country}
					userId={props.commerceProps.userId}
					pricingDataLoader={props.pricingDataLoader}
					options={{ cancelUrl: props.cancelUrl }}
				>
					<PricingMobileCtaContent
						title={props.title}
						ctaLabel={props.ctaLabel}
						product={props.product}
					/>
				</Pricing.Root>
			</div>
		)
	}

	if (props.mode === 'progress') {
		return (
			<div className={baseClassName}>
				<ProgressMobileCtaContent
					title={props.title}
					moduleType={props.moduleType}
					moduleSlug={props.moduleSlug}
					showContributor={props.showContributor}
				/>
			</div>
		)
	}

	// Custom mode
	return <div className={baseClassName}>{props.children}</div>
}

/**
 * Content for pricing mode mobile CTA.
 * Must be used within Pricing.Root context.
 */
function PricingMobileCtaContent({
	title,
	ctaLabel,
	product,
}: {
	title: string
	ctaLabel?: string
	product: Product
}) {
	const isMembership = product.type === 'membership'
	const defaultLabel = isMembership ? 'Subscribe' : 'Buy'
	const label = ctaLabel ?? defaultLabel

	return (
		<Pricing.Product className="flex w-full flex-row items-center justify-between gap-3">
			<div className="flex w-full flex-col gap-0.5">
				<h3 className="line-clamp-1 text-sm font-semibold">{title}</h3>
				<Pricing.Price className="flex-row items-baseline gap-2 [&>div]:mt-0 [&>div]:h-auto [&>div]:text-base [&_[aria-live]]:text-base [&_[aria-live]]:font-bold [&_[data-save-percent]]:text-xs [&_span.sup]:hidden [&_sup]:hidden" />
			</div>
			<Pricing.BuyButton className="h-10 w-auto rounded-md px-8">
				{label}
			</Pricing.BuyButton>
		</Pricing.Product>
	)
}

/**
 * Content for progress mode mobile CTA.
 * Uses module progress to determine button text and target.
 */
function ProgressMobileCtaContent({
	title,
	moduleType,
	moduleSlug,
	showContributor = true,
}: {
	title: string
	moduleType: string
	moduleSlug: string
	showContributor?: boolean
}) {
	const { moduleProgress } = useModuleProgress()
	const navigation = useContentNavigation()

	const hasProgress =
		moduleProgress &&
		moduleProgress.completedLessons &&
		moduleProgress.completedLessons.length > 0
	const nextResource = moduleProgress?.nextResource

	// Get first resource for "Start Watching"
	const flatResources = flattenNavigationResources(navigation)
	const firstResource = flatResources[0]
	const firstResourceSlug = getFirstResourceSlug(navigation)

	// Determine which button to show
	const showContinueWatching = hasProgress && nextResource?.fields?.slug

	let href: string | undefined
	let buttonText = 'Start Watching'

	if (showContinueWatching && nextResource) {
		href = getResourcePath(
			nextResource.type || 'lesson',
			nextResource.fields?.slug || '',
			'view',
			{ parentType: moduleType, parentSlug: moduleSlug },
		)
		buttonText = 'Continue'
	} else if (firstResourceSlug && firstResource) {
		href = getResourcePath(
			firstResource.type || 'lesson',
			firstResourceSlug || '',
			'view',
			{ parentType: moduleType, parentSlug: moduleSlug },
		)
	}

	if (!href) {
		return null
	}

	return (
		<>
			<div className="flex flex-col gap-0.5">
				<h3 className="font-heading line-clamp-1 text-base font-semibold">
					{title}
				</h3>
				{showContributor && (
					<Contributor className="gap-1 text-sm [&_img]:w-5" />
				)}
			</div>
			<Button asChild>
				<Link href={href}>{buttonText}</Link>
			</Button>
		</>
	)
}

/**
 * Combined pricing/progress mobile CTA.
 *
 * Automatically switches between:
 * - **Pricing mode**: When `allowPurchase` is true and not purchased
 * - **Progress mode**: When purchased
 * - **Hidden**: When `allowPurchase` is false and not purchased
 *
 * @example Workshop with product
 * ```tsx
 * <ResourceMobileCtaWithPricing
 *   title={workshop.title}
 *   moduleType="workshop"
 *   moduleSlug={moduleSlug}
 *   allowPurchase={allowPurchase}
 *   hasPurchased={hasPurchasedCurrentProduct}
 *   product={product}
 *   pricingDataLoader={pricingDataLoader}
 *   commerceProps={commerceProps}
 *   cancelUrl={cancelUrl}
 * />
 * ```
 */
export type ResourceMobileCtaWithPricingProps = BaseMobileCtaProps & {
	/** Resource title for display */
	title: string
	/** Module type for URL generation */
	moduleType: string
	/** Module slug for URL generation */
	moduleSlug: string
	/** Whether purchase is allowed (product published + public) */
	allowPurchase: boolean
	/** Whether user has purchased the product */
	hasPurchased: boolean
	/** Product for pricing (required when not purchased) */
	product: Product
	/** Pricing data loader (required when not purchased) */
	pricingDataLoader: Promise<PricingData>
	/** Commerce props for checkout */
	commerceProps: CommerceProps
	/** Cancel URL for Stripe checkout */
	cancelUrl: string
	/** Coupon ID if applicable */
	couponId?: string | null
	/** Custom CTA button text for buy button */
	ctaLabel?: string
	/** Whether to show contributor info in progress mode */
	showContributor?: boolean
}

export function ResourceMobileCtaWithPricing({
	className,
	title,
	moduleType,
	moduleSlug,
	allowPurchase,
	hasPurchased,
	product,
	pricingDataLoader,
	commerceProps,
	cancelUrl,
	couponId,
	ctaLabel,
	showContributor,
}: ResourceMobileCtaWithPricingProps) {
	// Show progress mode when purchased
	if (hasPurchased) {
		return (
			<ResourceMobileCta
				mode="progress"
				className={className}
				title={title}
				moduleType={moduleType}
				moduleSlug={moduleSlug}
				showContributor={showContributor}
			/>
		)
	}

	// Show pricing mode only when purchase is allowed
	if (allowPurchase) {
		return (
			<ResourceMobileCta
				mode="pricing"
				className={className}
				title={title}
				product={product}
				pricingDataLoader={pricingDataLoader}
				commerceProps={commerceProps}
				cancelUrl={cancelUrl}
				couponId={couponId}
				ctaLabel={ctaLabel}
			/>
		)
	}

	// Don't show anything when not purchased and purchase not allowed
	return null
}
