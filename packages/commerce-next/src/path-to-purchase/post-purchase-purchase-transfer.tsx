import * as React from 'react'
import { revalidatePath } from 'next/cache'
import { isEmpty } from 'lodash'

import { getPurchaseTransferForPurchaseId } from '../purchase-transfer/purchase-transfer-actions.js'
import { PurchaseTransferStatus } from '../purchase-transfer/purchase-transfer-status.js'

export const PurchaseTransfer = async ({
	bulkCouponId,
	purchase,
}: {
	bulkCouponId?: string
	purchase: { id: string; userId?: string | null }
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
					purchaseUserTransfers={purchaseUserTransfers}
					refetch={async () => {
						'use server'
						revalidatePath('/thanks/purchase')
					}}
				/>
			)}
		</div>
	)
}
