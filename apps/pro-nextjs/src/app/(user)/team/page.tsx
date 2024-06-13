import { TeamPageTemplate } from '@/app/(user)/team/page_client'
import { courseBuilderAdapter, db } from '@/db'
import { coupon } from '@/db/schema'
import { getServerAuthSession } from '@/server/auth'
import { eq } from 'drizzle-orm'

import {
	type Purchase,
	type UpgradableProduct,
	type User,
} from '@coursebuilder/core/schemas'

export type TeamPageData = {
	bulkCoupon?: any | null
	bulkPurchase: {
		purchase?: Purchase
		existingPurchase?: Purchase | null
		availableUpgrades: UpgradableProduct[]
	} | null
	user?: User | null
}

async function teamPageDataLoader(): Promise<TeamPageData> {
	const { getPurchasesForUser, getPurchaseDetails } = courseBuilderAdapter

	const { session } = await getServerAuthSession()
	const user = session?.user

	if (!user)
		return {
			bulkPurchase: null,
			user,
		}

	const purchases = await getPurchasesForUser(user.id)

	const bulkPurchaseData = purchases.find((purchase) => purchase.bulkCouponId)

	if (!bulkPurchaseData) {
		return {
			bulkPurchase: null,
			user,
		}
	}

	const bulkPurchase = await getPurchaseDetails(bulkPurchaseData.id, user.id)

	const bulkCoupon = bulkPurchase.purchase?.bulkCouponId
		? await db.query.coupon.findFirst({
				where: eq(coupon.id, bulkPurchase.purchase.bulkCouponId),
				with: {
					bulkCouponPurchases: {
						with: {
							user: true,
						},
					},
				},
			})
		: null

	return {
		bulkCoupon,
		bulkPurchase,
		user,
	}
}

export default async function TeamPage() {
	const pageData = await teamPageDataLoader()

	return <TeamPageTemplate {...pageData} />
}
