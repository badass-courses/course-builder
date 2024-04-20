import React from 'react'
import { isEmpty } from 'lodash'

import Spinner from '../spinner'
import { trpcSkillLessons } from '../utils/trpc-skill-lessons'

type ClaimedTeamSeatsProps = {
	purchase: {
		merchantChargeId: string | null
		bulkCoupon: { id: string; maxUses: number; usedCount: number } | null
		product: { id: string; name: string }
	}
	existingPurchase: {
		id: string
		product: { id: string; name: string }
	}
	session: any
	setPersonalPurchase: (props: any) => void
}

export const ClaimedTeamSeats: React.FC<
	React.PropsWithChildren<ClaimedTeamSeatsProps>
> = ({ purchase, existingPurchase, session, setPersonalPurchase }) => {
	const { data: claims, status } = trpcSkillLessons.coupons.claimedBy.useQuery({
		couponId: purchase?.bulkCoupon?.id,
	})

	return (
		<div data-claimed-seats-team="">
			{status === 'loading' ? (
				<div>
					<span className="sr-only">Loading claimed seats</span>
					<Spinner aria-hidden="true" className="h-6 w-6" />
				</div>
			) : (
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
			)}
		</div>
	)
}
