import CopyInviteLink from './copy-invite-link'

export const InlineTeamInvite = ({
	bulkCouponId,
	seatsPurchased,
}: {
	bulkCouponId?: string | null
	seatsPurchased: number
}) => {
	if (!bulkCouponId) return null

	return (
		<div className="mx-auto w-full border-b pb-5">
			<h2 className="text-primary pb-4 text-sm uppercase">Invite your team</h2>
			<div className="flex flex-col">
				<p className="pb-2 font-medium">
					You have purchased {seatsPurchased} seats.
				</p>
				<p className="pb-4">
					Invite your team to claim seats right away with this invite link.
					Don&apos;t worry about saving this anywhere, it will always be
					available on your{' '}
					<a
						className="font-medium underline"
						href={`${process.env.NEXT_PUBLIC_URL}/team`}
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
