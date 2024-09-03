import { Event } from '@/lib/events'
import { MDXRemoteSerializeResult } from 'next-mdx-remote'

import { Product, Purchase } from '@coursebuilder/core/schemas'
import { CommerceProps, PricingData } from '@coursebuilder/core/types'

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
