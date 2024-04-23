import * as React from 'react'
import { revalidatePath } from 'next/cache'
import { getPurchaseTransferForPurchaseId } from '@/purchase-transfer/purchase-transfer-actions'
import { PurchaseTransferStatus } from '@/purchase-transfer/purchase-transfer-status'
import { isEmpty } from 'lodash'

export const PurchaseTransfer: React.FC<{
	bulkCouponId?: string
	purchase: { id: string; userId?: string | null }
}> = async ({ bulkCouponId, purchase }) => {
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
