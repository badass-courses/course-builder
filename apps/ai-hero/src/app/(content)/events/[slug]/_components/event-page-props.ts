import type { ParsedUrlQuery } from 'querystring'
import type { courseBuilderAdapter } from '@/db'
import type { Event } from '@/lib/events'
import type { getSaleBannerData } from '@/lib/sale-banner'
import type { MDXRemoteSerializeResult } from 'next-mdx-remote'

import type { Product, Purchase } from '@coursebuilder/core/schemas'
import type {
	CommerceProps,
	PricingData,
	PricingOptions,
} from '@coursebuilder/core/types'

/**
 * Default coupon type extracted from adapter response.
 */
export type DefaultCoupon =
	| Extract<
			Awaited<ReturnType<typeof courseBuilderAdapter.getDefaultCoupon>>,
			{ defaultCoupon: unknown }
	  >['defaultCoupon']
	| null

/**
 * Sale data type from sale banner utility.
 */
export type SaleData = Awaited<ReturnType<typeof getSaleBannerData>> | null

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
	/** Default coupon for the product (site-wide sale) */
	defaultCoupon?: DefaultCoupon
	/** Sale banner data for discount display */
	saleData?: SaleData
	/** Whether purchase is allowed */
	allowPurchase?: boolean
	/** User data for logged-in users (name and email for pre-filling waitlist) */
	userData?: { name?: string | null; email: string }
} & CommerceProps
