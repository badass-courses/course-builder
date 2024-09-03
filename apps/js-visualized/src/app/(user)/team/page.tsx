import { TeamPageTemplate } from '@/app/(user)/team/page_client'
import { courseBuilderAdapter } from '@/db'
import { getPricingData } from '@/lib/pricing-query'
import { getServerAuthSession } from '@/server/auth'

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

			const bulkCoupon = await courseBuilderAdapter.getCouponWithBulkPurchases(
				purchaseDetails?.purchase?.bulkCouponId as string,
			)

			return {
				bulkPurchase: purchaseDetails,
				pricingDataLoader,
				...(bulkCoupon && { bulkCoupon }),
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

	return <TeamPageTemplate {...pageData} />
}
