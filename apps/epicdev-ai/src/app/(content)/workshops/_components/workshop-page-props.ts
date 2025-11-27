import type { courseBuilderAdapter } from '@/db'
import type { getSaleBannerData, SaleBannerData } from '@/lib/sale-banner'
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
	defaultCoupon?:
		| Extract<
				Awaited<ReturnType<typeof courseBuilderAdapter.getDefaultCoupon>>,
				{ defaultCoupon: unknown }
		  >['defaultCoupon']
		| null
	saleData?: SaleBannerData | null
} & CommerceProps
