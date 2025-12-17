/**
 * Unified pricing types consolidating definitions from multiple files.
 *
 * Previously duplicated in:
 * - src/app/(commerce)/products/[slug]/_components/pricing-widget.tsx
 * - src/app/(content)/workshops/_components/pricing-widget.tsx
 * - src/app/(content)/events/[slug]/_components/inline-event-pricing.tsx
 * - src/components/commerce/home-pricing-widget.tsx
 */

import { z } from 'zod'

import type { Product, Purchase } from '@coursebuilder/core/schemas'
import type {
	CommerceProps,
	FormattedPrice,
	PricingOptions,
} from '@coursebuilder/core/types'

/**
 * Data returned from pricing data loaders.
 */
export type PricingData = {
	formattedPrice?: FormattedPrice | null
	purchaseToUpgrade?: Purchase | null
	quantityAvailable: number
}

/**
 * Schema for pricing widget options - validates configuration at runtime.
 */
export const pricingWidgetOptionsSchema = z.object({
	withTitle: z.boolean().optional(),
	withImage: z.boolean().optional(),
	withGuaranteeBadge: z.boolean().optional(),
	isLiveEvent: z.boolean().optional(),
	isCohort: z.boolean().optional(),
	isPPPEnabled: z.boolean().optional(),
	allowTeamPurchase: z.boolean().optional(),
	teamQuantityLimit: z.number().optional(),
	cancelUrl: z.string().optional(),
})

/**
 * Options for configuring pricing widget behavior and display.
 */
export type PricingWidgetOptions = z.infer<typeof pricingWidgetOptionsSchema> &
	Partial<PricingOptions>

/**
 * Base props shared by all pricing components.
 */
export type BasePricingProps = {
	product: Product
	quantityAvailable: number
	commerceProps: CommerceProps
	pricingDataLoader: Promise<PricingData>
	hasPurchasedCurrentProduct?: boolean
	className?: string
}

/**
 * Workshop feature list for pricing display.
 */
export type WorkshopFeatureProps = {
	workshops?: { title: string; slug: string }[]
}
