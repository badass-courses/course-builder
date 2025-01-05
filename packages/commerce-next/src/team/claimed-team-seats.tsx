import React from 'react'

import { Purchase, type Coupon } from '@coursebuilder/core/schemas'
import { isEmpty } from '@coursebuilder/nodash'
import { cn } from '@coursebuilder/ui/utils/cn'

type ClaimedTeamSeatsProps = {
	purchase: Purchase
	bulkCoupon?: Coupon | null
	className?: string
}

export const ClaimedTeamSeats: React.FC<
	React.PropsWithChildren<ClaimedTeamSeatsProps>
> = ({ purchase, bulkCoupon, className }) => {
	if (!purchase.bulkCouponId) return null
	const claims = bulkCoupon?.redeemedBulkCouponPurchases || []

	return (
		<div data-claimed-seats-team="" className={cn('', className)}>
			<>
				{!isEmpty(claims) && (
					<div className="font-semibold">Claimed team seats:</div>
				)}
				{!isEmpty(claims) ? (
					claims?.map((claim: any) => (
						<div
							data-claimed-seat=""
							className="pb-1.5"
							key={claim.user?.email}
						>
							{claim.user?.email}
						</div>
					))
				) : (
					<div data-claimed-seat="empty">
						No one from your team has claimed a seat yet.
					</div>
				)}
			</>
		</div>
	)
}
