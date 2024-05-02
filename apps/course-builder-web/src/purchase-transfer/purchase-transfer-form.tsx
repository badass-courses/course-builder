'use client'

import { useRouter } from 'next/navigation'
import { initiatePurchaseTransfer } from '@/purchase-transfer/purchase-transfer-actions'
import { useForm } from 'react-hook-form'

import { PurchaseUserTransfer } from '@coursebuilder/core/schemas'

type PurchaseTransferFormData = {
	email: string
}

export const PurchaseTransferForm = ({
	purchaseUserTransfer,
}: {
	purchaseUserTransfer?: PurchaseUserTransfer
}) => {
	const {
		register,
		handleSubmit,
		watch,
		reset,
		formState: { errors },
	} = useForm<PurchaseTransferFormData>()
	const router = useRouter()

	const onSubmit = async (data: PurchaseTransferFormData) => {
		if (!purchaseUserTransfer) {
			throw new Error('No purchaseUserTransfer found')
		}
		// await initiatePurchaseTransfer({
		// 	email: data.email,
		// 	purchaseUserTransferId: purchaseUserTransfer.id,
		// })
		router.refresh()
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
				className="relative flex flex-shrink-0 items-center justify-center rounded-md bg-gray-400/20 px-5 py-2 font-semibold shadow-2xl shadow-gray-900/50 transition hover:brightness-110 focus-visible:ring-white"
				type="submit"
				disabled={!purchaseUserTransfer}
			>
				Transfer
			</button>
			{/*{error && <span>{error.message}</span>}*/}
		</form>
	)
}
