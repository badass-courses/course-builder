import type { ParsedUrlQuery } from 'querystring'
import type { Event } from '@/lib/events'
import type { MDXRemoteSerializeResult } from 'next-mdx-remote'

import type { Product, Purchase } from '@coursebuilder/core/schemas'
import type {
	CommerceProps,
	PricingData,
	PricingOptions,
} from '@coursebuilder/core/types'

/**
 * Props for event pages and pricing components. Mirrors the structure of
 * CohortPageProps for consistent commerce handling.
 */
export type EventPageProps = {
	event: Event
	quantityAvailable: number
	totalQuantity: number
	purchaseCount: number
	product?: Product
	mdx?: MDXRemoteSerializeResult
	hasPurchasedCurrentProduct?: boolean
	availableBonuses: any[]
	existingPurchase?: (Purchase & { product?: Product | null }) | null
	purchases?: Purchase[]
	userId?: string
	pricingDataLoader: Promise<PricingData>
	pricingWidgetOptions?: Partial<PricingOptions>
	organizationId?: string | null
} & CommerceProps
