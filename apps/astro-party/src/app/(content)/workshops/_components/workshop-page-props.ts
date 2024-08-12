import { type Module } from '@/lib/module'
import { MDXRemoteSerializeResult } from 'next-mdx-remote'

import { PricingData } from '@coursebuilder/commerce-next/pricing/pricing-widget'
import { CommerceProps } from '@coursebuilder/commerce-next/utils/commerce-props'
import { Product, Purchase } from '@coursebuilder/core/schemas'

export type WorkshopPageProps = {
	quantityAvailable: number
	product?: Product
	mdx?: MDXRemoteSerializeResult
	hasPurchasedCurrentProduct?: boolean
	availableBonuses: any[]
	existingPurchase?: (Purchase & { product?: Product | null }) | null
	purchases?: Purchase[]
	purchasedProductIds?: string[]
	userId?: string
	pricingDataLoader: Promise<PricingData>
} & CommerceProps
