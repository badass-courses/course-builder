import React from 'react'
import { isEmpty } from 'lodash'

import { Purchase } from '@coursebuilder/core/schemas'

type ClaimedTeamSeatsProps = {
	purchase: Purchase
	bulkCoupon?: any | null
}

export const ClaimedTeamSeats: React.FC<
	React.PropsWithChildren<ClaimedTeamSeatsProps>
> = ({ purchase, bulkCoupon }) => {
	if (!purchase.bulkCouponId) return null
	const claims = bulkCoupon?.bulkCouponPurchases || []

	return (
		<div data-claimed-seats-team="">
			<>
				{!isEmpty(claims) ? (
					claims?.map((claim: any) => (
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
