import { Cohort, CohortSchema } from '@/lib/cohort'
import { Event } from '@/lib/events'
import { MDXRemoteSerializeResult } from 'next-mdx-remote'
import z from 'zod'

import {
	Product,
	productSchema,
	Purchase,
	purchaseSchema,
} from '@coursebuilder/core/schemas'
import {
	CommerceProps,
	PricingData,
	type PricingOptions,
} from '@coursebuilder/core/types'

export type CohortPageProps = {
	cohort: Cohort
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
} & CommerceProps
