import React from 'react'
import { z } from 'zod'

import { Purchase } from '@coursebuilder/core/schemas'

import CopyInviteLink from './copy-invite-link'
import SelfRedeemButton from './self-redeem-button'

type InviteTeamProps = {
	purchase?: Purchase
	existingPurchase?: Purchase | null
	userEmail: string | null
	setPersonalPurchase: (props: any) => void
	className?: string
}

const InviteTeam: React.FC<React.PropsWithChildren<InviteTeamProps>> = ({
	purchase,
	existingPurchase,
	userEmail,
	setPersonalPurchase,
	className = '',
}) => {
	const [selfRedemptionSucceeded, setSelfRedemptionSucceeded] =
		React.useState<boolean>(false)

	const bulkCouponSchema = z
		.object({ id: z.string(), maxUses: z.number(), usedCount: z.number() })
		.nullable()
		.transform((data, ctx) => {
			if (data === null) {
				ctx.addIssue({
					code: z.ZodIssueCode.custom,
					message:
						'The purchase is either not a bulk purchase or was queried without its bulk coupon.',
				})
				return z.NEVER
			}

			const { id, maxUses, usedCount: _usedCount } = data

			// manually increment the usedCount by 1 if a self-redemption happened
			// during this componenet's lifecycle.
			const usedCount = _usedCount + (selfRedemptionSucceeded ? 1 : 0)

			return {
				bulkCouponId: id,
				maxUses,
				usedCount,
				numberOfRedemptionsLeft: maxUses - usedCount,
				hasRedemptionsLeft: maxUses > usedCount,
			}
		})

	const {
		bulkCouponId,
		maxUses,
		usedCount,
		numberOfRedemptionsLeft,
		hasRedemptionsLeft,
	} = bulkCouponSchema.parse(purchase?.bulkCoupon)

	const [canRedeem, setCanRedeem] = React.useState(Boolean(!existingPurchase))

	console.log({ canRedeem, purchase, existingPurchase })

	return (
		<div data-invite-team="" className={className}>
			<p data-title="">
				You have <strong>{numberOfRedemptionsLeft} seats left</strong>
				.<br />
				{usedCount > 0 &&
					`Your team has already redeemed ${usedCount} of ${maxUses} seats. `}
				{hasRedemptionsLeft &&
					bulkCouponId &&
					'Send the invite link below to your colleagues to get started:'}
			</p>
			{bulkCouponId && (
				<>
					<div data-copy-invite-link-container="">
						<CopyInviteLink
							bulkCouponId={bulkCouponId}
							disabled={!hasRedemptionsLeft}
						/>
					</div>
					{canRedeem && (
						<div data-redeem="">
							<p data-title="">Or get access yourself</p>
							<SelfRedeemButton
								bulkCouponId={bulkCouponId}
								userEmail={userEmail}
								onSuccess={(redeemedPurchase) => {
									setCanRedeem(false)
									setPersonalPurchase(redeemedPurchase)
									setSelfRedemptionSucceeded(true)
								}}
								productId={purchase?.product?.id}
								disabled={!hasRedemptionsLeft}
							/>
						</div>
					)}
				</>
			)}
		</div>
	)
}

export default InviteTeam
