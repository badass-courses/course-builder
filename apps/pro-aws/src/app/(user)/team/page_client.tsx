'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { TeamPageData } from '@/app/(user)/team/page'

import { BuyMoreSeats } from '@coursebuilder/commerce-next/post-purchase/buy-more-seats'
import { ClaimedTeamSeats } from '@coursebuilder/commerce-next/team/claimed-team-seats'
import { InviteTeam } from '@coursebuilder/commerce-next/team/invite-team'
import { Card } from '@coursebuilder/ui'

export function TeamPageTemplate({
	bulkPurchase,
	user,
	bulkCoupon,
}: TeamPageData) {
	const router = useRouter()

	if (!bulkPurchase) return <h1>No Team Found</h1>

	const { purchase, existingPurchase } = bulkPurchase

	const canInviteTeam = Boolean(purchase && user)

	return (
		<main
			data-team-page=""
			className="mx-auto flex w-full max-w-xl flex-grow flex-col items-center justify-center gap-3 p-5 pb-16 pt-28 "
		>
			{user && canInviteTeam && (
				<div
					key={bulkPurchase.purchase?.id}
					data-team-card=""
					className="w-full rounded-lg border border-gray-700/30 p-5 shadow-xl shadow-black/10"
				>
					{bulkPurchase.purchase?.product?.name} {bulkPurchase.purchase?.id}
					<InviteTeam
						purchase={purchase}
						existingPurchase={existingPurchase}
						userEmail={user.email}
						setPersonalPurchase={() => {
							router.refresh()
						}}
					/>
				</div>
			)}
			{user && purchase?.product?.id && (
				<Card>
					<BuyMoreSeats productId={purchase.product.id} userId={user?.id} />
				</Card>
			)}

			{purchase && (
				<Card>
					<ClaimedTeamSeats purchase={purchase} bulkCoupon={bulkCoupon} />
				</Card>
			)}
		</main>
	)
}
