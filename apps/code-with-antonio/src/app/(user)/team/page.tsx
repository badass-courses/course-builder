import { TeamPageTemplate } from '@/app/(user)/team/page_client'
import LayoutClient from '@/components/layout-client'
import { courseBuilderAdapter, db } from '@/db'
import { coupon } from '@/db/schema'
import { getPricingData } from '@/lib/pricing-query'
import {
	getTeamSubscriptionsForUser,
	hasUserClaimedSeat,
	type TeamSubscription,
} from '@/lib/team-subscriptions'
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
	teamSubscriptions: Array<TeamSubscription & { userHasClaimed: boolean }>
	user?: User | null
}

/**
 * Loads data for the team management page.
 * Includes both bulk purchases (coupon-based teams) and subscription teams.
 */
async function teamPageDataLoader(): Promise<TeamPageData> {
	const { getPurchasesForUser, getPurchaseDetails } = courseBuilderAdapter

	const { session } = await getServerAuthSession()
	const user = session?.user

	if (!user) {
		return {
			bulkPurchases: [],
			teamSubscriptions: [],
			user,
		}
	}

	// Load bulk purchases
	const purchases = await getPurchasesForUser(user.id)
	const bulkPurchasesData = purchases.filter(
		(purchase) => purchase.bulkCouponId,
	)

	const bulkPurchases = await Promise.all(
		bulkPurchasesData.map(async (bulkPurchase) => {
			const purchaseDetails = await getPurchaseDetails(bulkPurchase.id, user.id)
			const pricingDataLoader = getPricingData({
				productId: bulkPurchase?.product?.id,
			})

			// Get the bulk coupon and check if it's active
			const bulkCouponId = purchaseDetails?.purchase?.bulkCouponId
			const bulkCoupon = bulkCouponId
				? await courseBuilderAdapter.getCouponWithBulkPurchases(bulkCouponId)
				: null

			// Only include active coupons (status = 1)
			const activeBulkCoupon = bulkCoupon?.status === 1 ? bulkCoupon : null

			return {
				bulkPurchase: purchaseDetails,
				pricingDataLoader,
				...(activeBulkCoupon && { bulkCoupon: activeBulkCoupon }),
			}
		}),
	)

	// Load team subscriptions (seats > 1, user is owner)
	const teamSubscriptions = await getTeamSubscriptionsForUser(user.id)

	// Check if user has claimed a seat on each subscription
	const teamSubscriptionsWithClaimStatus = await Promise.all(
		teamSubscriptions.map(async (sub) => ({
			...sub,
			userHasClaimed: await hasUserClaimedSeat(sub.subscription.id, user.id),
		})),
	)

	return {
		bulkPurchases,
		teamSubscriptions: teamSubscriptionsWithClaimStatus,
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
