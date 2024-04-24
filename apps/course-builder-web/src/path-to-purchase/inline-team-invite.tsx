import * as React from 'react'
import { env } from '@/env.mjs'
import CopyInviteLink from '@/team/copy-invite-link'

export const InlineTeamInvite = ({
	bulkCouponId,
	seatsPurchased,
}: {
	bulkCouponId?: string | null
	seatsPurchased: number
}) => {
	if (!bulkCouponId) return null

	return (
		<div className="mx-auto w-full">
			<h2 className="pb-2 text-sm font-semibold uppercase tracking-wide">
				Invite your team
			</h2>
			<div className="flex flex-col rounded-lg border border-gray-700/30 bg-gray-800 p-5 shadow-xl shadow-black/10">
				<p className="pb-2 font-semibold">
					You have purchased {seatsPurchased} seats.
				</p>
				<p className="pb-2">
					Invite your team to claim seats right away with this invite link.
					Don&apos;t worry about saving this anywhere, it will always be
					available on your{' '}
					<a
						className="font-semibold underline"
						href={`${env.NEXT_PUBLIC_URL}/team`}
					>
						Team page
					</a>{' '}
					once you sign in.
				</p>
				<CopyInviteLink bulkCouponId={bulkCouponId} />
			</div>
		</div>
	)
}
