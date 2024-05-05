import { Event } from '@/lib/events'
import { PricingData } from '@/lib/pricing-query'
import { CommerceProps } from '@/pricing/commerce-props'
import { MDXRemoteSerializeResult } from 'next-mdx-remote'

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
