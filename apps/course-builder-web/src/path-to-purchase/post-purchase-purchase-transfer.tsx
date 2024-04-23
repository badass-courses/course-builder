'use client'

import * as React from 'react'
import { Transfer } from '@/purchase-transfer/purchase-transfer'
import { api } from '@/trpc/react'
import { isEmpty } from 'lodash'

export const PurchaseTransfer: React.FC<{
	bulkCouponId?: string
	purchase: { id: string; userId?: string | null }
}> = ({ bulkCouponId, purchase }) => {
	const { data: purchaseUserTransfers, refetch } =
		api.purchaseUserTransfer.forPurchaseId.useQuery({
			id: purchase.id,
			sourceUserId: purchase.userId || undefined,
		})

	console.log({ purchaseUserTransfers })

	if (bulkCouponId) return null
	if (isEmpty(purchaseUserTransfers)) return null

	return (
		<div>
			<h2 className="pb-2 text-sm font-semibold uppercase tracking-wide">
				Transfer this purchase to another email address
			</h2>
			{purchaseUserTransfers && (
				<Transfer
					purchaseUserTransfers={purchaseUserTransfers}
					refetch={refetch}
				/>
			)}
		</div>
	)
}
