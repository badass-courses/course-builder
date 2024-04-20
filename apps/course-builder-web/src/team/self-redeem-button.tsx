import React from 'react'
import { Purchase } from '@skillrecordings/database'
import { Button } from '@skillrecordings/react'
import toast from 'react-hot-toast'

import { handleSelfRedeem } from '../path-to-purchase/handle-self-redeem'

const SelfRedeemButton: React.FC<
	React.PropsWithChildren<{
		userEmail: string | null | undefined
		bulkCouponId: string
		onSuccess: (redeemedPurchase: Purchase) => void
		disabled: boolean
		productId?: string
		className?: string
	}>
> = ({ userEmail, bulkCouponId, onSuccess, disabled, productId, children }) => {
	const [isLoading, setIsLoading] = React.useState(false)
	return (
		<Button
			data-self-redeem-button=""
			isLoading={isLoading}
			disabled={disabled || !userEmail}
			onClick={() => {
				if (userEmail) {
					setIsLoading(true)
					handleSelfRedeem(userEmail, bulkCouponId, productId, (params) => {
						if (params.status === 'success') {
							onSuccess(params.redeemedPurchase)
						} else {
							// TODO: report to sentry or support?
							console.log(params.error)
							if (params.error.startsWith('already-purchased-')) {
								toast.error(
									'You have already redeemed a seat for yourself. Please contact support if you are having trouble accessing it.',
								)
							} else {
								toast.error(
									'We were unable to redeem a seat for this account. If the issue persists, please reach out to support.',
								)
							}
						}

						setIsLoading(false)
					})
				}
			}}
		>
			{children || 'Claim one seat for yourself'}
		</Button>
	)
}

export default SelfRedeemButton
