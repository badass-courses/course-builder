import { Event } from '@/lib/events'
import { MDXRemoteSerializeResult } from 'next-mdx-remote'

import { PricingData } from '@coursebuilder/commerce-next/pricing/pricing-widget'
import { CommerceProps } from '@coursebuilder/commerce-next/utils/commerce-props'
import { Product, Purchase } from '@coursebuilder/core/schemas'

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
} & CommerceProps
