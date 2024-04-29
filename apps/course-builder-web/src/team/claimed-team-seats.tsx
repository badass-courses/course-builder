import React from 'react'
import { db } from '@/db'
import { coupon } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { isEmpty } from 'lodash'

import { Purchase } from '@coursebuilder/core/schemas'

type ClaimedTeamSeatsProps = {
	purchase: Purchase
	existingPurchase: {
		id: string
		product: { id: string; name: string }
	}
	session: any
	setPersonalPurchase: (props: any) => void
}

export const ClaimedTeamSeats: React.FC<
	React.PropsWithChildren<ClaimedTeamSeatsProps>
> = async ({ purchase, existingPurchase, session, setPersonalPurchase }) => {
	if (!purchase.bulkCouponId) return null

	const bulkCoupon = await db.query.coupon.findFirst({
		where: eq(coupon.id, purchase.bulkCouponId),
		with: {
			bulkCouponPurchases: {
				with: {
					user: true,
				},
			},
		},
	})

	const claims = bulkCoupon?.bulkCouponPurchases || []

	return (
		<div data-claimed-seats-team="">
			<>
				{!isEmpty(claims) ? (
					claims?.map((claim) => (
						<div data-claimed-seat="" key={claim.user?.email}>
							{claim.user?.email}
						</div>
					))
				) : (
					<div data-claimed-seat="empty">No one has claimed a seat yet.</div>
				)}
			</>
		</div>
	)
}
