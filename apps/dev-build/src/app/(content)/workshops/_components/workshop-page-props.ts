import { MDXRemoteSerializeResult } from 'next-mdx-remote'

import { Product, Purchase } from '@coursebuilder/core/schemas'
import { CommerceProps, PricingData } from '@coursebuilder/core/types'

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
