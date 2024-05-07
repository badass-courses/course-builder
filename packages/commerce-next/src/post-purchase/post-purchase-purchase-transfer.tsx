import * as React from 'react'
import { isEmpty } from 'lodash'

import { PurchaseUserTransfer } from '@coursebuilder/core/schemas'

import { PurchaseTransferStatus } from './purchase-transfer-status'

export const PurchaseTransfer = async ({
	bulkCouponId,
	purchase,
	getPurchaseTransferForPurchaseId,
	cancelPurchaseTransfer,
	initiatePurchaseTransfer,
	onTransferInitiated,
}: {
	bulkCouponId?: string
	purchase: { id: string; userId?: string | null }
	getPurchaseTransferForPurchaseId: (input: {
		sourceUserId: string | null | undefined
		id: string
	}) => Promise<PurchaseUserTransfer[]>
	cancelPurchaseTransfer: (input: {
		purchaseUserTransferId: string
	}) => Promise<any>
	initiatePurchaseTransfer: (input: {
		email: string
		purchaseUserTransferId: string
	}) => Promise<any>
	onTransferInitiated: () => Promise<any>
}) => {
	const purchaseUserTransfers = await getPurchaseTransferForPurchaseId({
		id: purchase.id,
		sourceUserId: purchase.userId || undefined,
	})

	if (bulkCouponId) return null
	if (isEmpty(purchaseUserTransfers)) return null

	return (
		<div>
			<h2 className="pb-2 text-sm font-semibold uppercase tracking-wide">
				Transfer this purchase to another email address
			</h2>
			{purchaseUserTransfers && (
				<PurchaseTransferStatus
					initiatePurchaseTransfer={initiatePurchaseTransfer}
					cancelPurchaseTransfer={cancelPurchaseTransfer}
					purchaseUserTransfers={purchaseUserTransfers}
					refetch={async () => {
						if (onTransferInitiated) {
							await onTransferInitiated()
						}
					}}
				/>
			)}
		</div>
	)
}
