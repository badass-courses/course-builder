'use client'

import { useRouter } from 'next/navigation.js'
import Balancer from 'react-wrap-balancer'

import { PurchaseUserTransfer } from '@coursebuilder/core/schemas'

import { PurchaseTransferForm } from './purchase-transfer-form.js'

export const PurchaseTransferStatus = ({
	purchaseUserTransfers,
	initiatePurchaseTransfer,
	cancelPurchaseTransfer,
}: {
	purchaseUserTransfers: PurchaseUserTransfer[]
	refetch: () => Promise<any>
	initiatePurchaseTransfer: (input: {
		email: string
		purchaseUserTransferId: string
	}) => Promise<any>
	cancelPurchaseTransfer: (input: {
		purchaseUserTransferId: string
	}) => Promise<any>
}) => {
	const router = useRouter()

	console.log({ purchaseUserTransfers })
	return (
		<div id="purchase-transfer">
			{purchaseUserTransfers.map((purchaseUserTransfer) => {
				const STATE = purchaseUserTransfer.transferState

				return (
					<div
						key={purchaseUserTransfer.id}
						data-transfer-state={STATE}
						className="flex flex-col gap-3"
					>
						{STATE === 'AVAILABLE' && (
							<>
								<h2 className="text-2xl font-bold">
									Transfer this purchase to another email address
								</h2>
								<p>
									You can transfer your purchase to another email address. We
									recommend using a personal/permanent email address. Once the
									transfer is complete you will no longer have access to the
									content or associated invoices from this account for this
									purchase.
								</p>
								<p>
									Only a single email transfer is provided per purchase as a
									courtesy!
								</p>
								<PurchaseTransferForm
									purchaseUserTransfer={purchaseUserTransfer}
									key={purchaseUserTransfer.id}
									initiatePurchaseTransfer={initiatePurchaseTransfer}
								/>
							</>
						)}
						{STATE === 'INITIATED' && (
							<>
								<h2 className="mb-3 text-2xl font-bold">
									This purchase is being transferred. Once accepted you will no
									longer have access to this purchase or its associated invoice.
									You can cancel the transfer at any time before it is accepted
									or expires.
								</h2>
								<button
									className="bg-brand-red text-gray relative flex flex-shrink-0 items-center justify-center rounded-md px-5 py-2 font-semibold shadow-2xl shadow-gray-900/50 transition hover:brightness-110 focus-visible:ring-white"
									onClick={async () => {
										await cancelPurchaseTransfer({
											purchaseUserTransferId: purchaseUserTransfer.id,
										})
										router.refresh()
									}}
								>
									Cancel Transfer
								</button>
							</>
						)}
						{STATE === 'COMPLETED' && (
							<>
								<p>
									<Balancer>
										This purchase has been transferred. You no longer have
										access to this purchase or its associated invoice.
									</Balancer>
								</p>
							</>
						)}
					</div>
				)
			})}
		</div>
	)
}
