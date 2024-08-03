import { TeamPageTemplate } from '@/app/(user)/team/page_client'
import { courseBuilderAdapter, db } from '@/db'
import { coupon } from '@/db/schema'
import { getPricingData } from '@/lib/pricing-query'
import { getServerAuthSession } from '@/server/auth'
import { eq } from 'drizzle-orm'

import type { PricingData } from '@coursebuilder/commerce-next/pricing/pricing-widget'
import {
	type Coupon,
	type Purchase,
	type UpgradableProduct,
	type User,
} from '@coursebuilder/core/schemas'

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
			// TODO: This should return redeemedBulkCouponPurchases
			const bulkCoupon = await courseBuilderAdapter.getCouponWithBulkPurchases(
				purchaseDetails?.purchase?.bulkCouponId as string,
			)

			// const bulkCoupon = purchaseDetails.purchase?.bulkCouponId
			// 	? await db.query.coupon.findFirst({
			// 			where: eq(coupon.id, purchaseDetails.purchase.bulkCouponId),
			// 			with: {
			// 				redeemedBulkCouponPurchases: {
			// 					with: {
			// 						user: true,
			// 					},
			// 				},
			// 			},
			// 		})
			// 	: null

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
