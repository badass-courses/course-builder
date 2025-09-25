import { TeamPageTemplate } from '@/app/(user)/team/page_client'
import LayoutClient from '@/components/layout-client'
import { courseBuilderAdapter, db } from '@/db'
import { coupon } from '@/db/schema'
import { getPricingData } from '@/lib/pricing-query'
import { getServerAuthSession } from '@/server/auth'
import { eq } from 'drizzle-orm'

import {
	type Coupon,
	type Purchase,
	type UpgradableProduct,
	type User,
} from '@coursebuilder/core/schemas'
import type { PricingData } from '@coursebuilder/core/types'

export type TeamPageData = {
	bulkPurchases: {
		bulkCoupon?: any | null
		pricingDataLoader: Promise<PricingData>
		bulkPurchase: {
			purchase?: Purchase
			existingPurchase?: Purchase | null
			availableUpgrades: UpgradableProduct[]
		} | null
	}[]

	user?: User | null
}

async function teamPageDataLoader(): Promise<TeamPageData> {
	const { getPurchasesForUser, getPurchaseDetails } = courseBuilderAdapter

	const { session } = await getServerAuthSession()
	const user = session?.user

	if (!user) {
		return {
			bulkPurchases: [],
			user,
		}
	}

	const purchases = await getPurchasesForUser(user.id)

	const bulkPurchasesData = purchases.filter(
		(purchase) => purchase.bulkCouponId,
	)

	if (!bulkPurchasesData.length) {
		return {
			bulkPurchases: [],
			user,
		}
	}

	const bulkPurchases = await Promise.all(
		bulkPurchasesData.map(async (bulkPurchase) => {
			const purchaseDetails = await getPurchaseDetails(bulkPurchase.id, user.id)
			const pricingDataLoader = getPricingData({
				productId: bulkPurchase?.product?.id,
			})

			// Get the bulk coupon and check if it's active
			const bulkCoupon = await courseBuilderAdapter.getCouponWithBulkPurchases(
				purchaseDetails?.purchase?.bulkCouponId as string,
			)

			// Only include active coupons (status = 1)
			const activeBulkCoupon = bulkCoupon?.status === 1 ? bulkCoupon : null

			return {
				bulkPurchase: purchaseDetails,
				pricingDataLoader,
				...(activeBulkCoupon && { bulkCoupon: activeBulkCoupon }),
			}
		}),
	)

	return {
		bulkPurchases,
		user,
	}
}

export default async function TeamPage() {
	const pageData = await teamPageDataLoader()

	return (
		<LayoutClient withContainer>
			<TeamPageTemplate {...pageData} />
		</LayoutClient>
	)
}
