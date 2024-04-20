import { api } from '@/trpc/react'
import { useForm } from 'react-hook-form'
import Balancer from 'react-wrap-balancer'

import { PurchaseUserTransfer } from '@coursebuilder/core/schemas'

type PurchaseTransferFormData = {
	email: string
}

const PurchaseTransferForm = ({
	purchaseUserTransferId,
	refetch,
}: {
	purchaseUserTransferId: string
	refetch: () => Promise<void>
}) => {
	const utils = api.useContext()
	const {
		register,
		handleSubmit,
		watch,
		reset,
		formState: { errors },
	} = useForm<PurchaseTransferFormData>()
	const { data: purchaseUserTransfer, status } =
		api.purchaseUserTransfer.byId.useQuery({
			id: purchaseUserTransferId,
		})

	const { mutate, error, isLoading } =
		api.purchaseUserTransfer.initiate.useMutation({
			onSuccess: async (input) => {
				utils.invalidate()
				reset()
				refetch()
			},
		})
	const onSubmit = (data: PurchaseTransferFormData) => {
		mutate({
			purchaseUserTransferId: purchaseUserTransferId,
			email: data.email,
		})
	}

	return (
		<form
			id="purchase-transfer-form"
			className="flex w-full flex-col gap-2 text-left md:flex-row"
			onSubmit={handleSubmit(onSubmit)}
		>
			<label className="sr-only" htmlFor="email">
				Email:
			</label>
			<input
				className="w-full rounded-md bg-gray-200/60 px-3 py-2 shadow-inner placeholder:text-gray-500"
				type="email"
				{...register('email', { required: true })}
				placeholder="somebody@example.com"
			/>
			{errors.email && <span>This field is required</span>}
			<button
				className="relative flex flex-shrink-0 items-center justify-center rounded-full bg-cyan-400/20 px-5 py-2 font-semibold text-white shadow-2xl shadow-cyan-900/50 transition hover:brightness-110 focus-visible:ring-white"
				type="submit"
				disabled={isLoading}
			>
				Transfer
			</button>
			{error && <span>{error.message}</span>}
		</form>
	)
}

export const Transfer = ({
	purchaseUserTransfers,
	refetch,
}: {
	purchaseUserTransfers: PurchaseUserTransfer[]
	refetch: () => Promise<any>
}) => {
	const cancelMutation = api.purchaseUserTransfer.cancel.useMutation({
		onSuccess: async (input) => {
			refetch()
		},
	})

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
									purchaseUserTransferId={purchaseUserTransfer.id}
									key={purchaseUserTransfer.id}
									refetch={refetch}
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
									className="bg-brand-red relative flex flex-shrink-0 items-center justify-center rounded-full px-5 py-2 font-semibold text-white shadow-2xl shadow-cyan-900/50 transition hover:brightness-110 focus-visible:ring-white"
									onClick={() => {
										cancelMutation.mutate({
											purchaseUserTransferId: purchaseUserTransfer.id,
										})
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
