'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Slot } from '@radix-ui/react-slot'
import {
	FieldErrors,
	useForm,
	type UseFormRegister,
	type UseFormWatch,
} from 'react-hook-form'

import { PurchaseUserTransfer } from '@coursebuilder/core/schemas'
import { Button, Input } from '@coursebuilder/ui'
import { cn } from '@coursebuilder/ui/utils/cn'

type PurchaseTransferContextType = {
	purchaseUserTransfers: PurchaseUserTransfer[]
	bulkCouponId?: string
	cancelPurchaseTransfer: (input: {
		purchaseUserTransferId: string
	}) => Promise<any>
	initiatePurchaseTransfer: (input: {
		email: string
		purchaseUserTransferId: string
	}) => Promise<any>
	onTransferInitiated: () => Promise<any>
}

const PurchaseTransferContext = React.createContext<
	PurchaseTransferContextType | undefined
>(undefined)

export const PurchaseTransferProvider: React.FC<
	PurchaseTransferContextType & { children: React.ReactNode }
> = ({ children, ...props }) => {
	return (
		<PurchaseTransferContext.Provider value={props}>
			{children}
		</PurchaseTransferContext.Provider>
	)
}

export const usePurchaseTransfer = () => {
	const context = React.use(PurchaseTransferContext)
	if (context === undefined) {
		throw new Error(
			'usePurchaseTransfer must be used within an PurchaseTransferProvider',
		)
	}
	return context
}

// status context

type PurchaseTransferStatusContextType = {
	purchaseUserTransfer: PurchaseUserTransfer
}

const PurchaseTransferStatusContext = React.createContext<
	PurchaseTransferStatusContextType | undefined
>(undefined)

export const PurchaseTransferStatusProvider: React.FC<
	PurchaseTransferStatusContextType & { children: React.ReactNode }
> = ({ children, ...props }) => {
	return (
		<PurchaseTransferStatusContext.Provider value={props}>
			{children}
		</PurchaseTransferStatusContext.Provider>
	)
}

export const usePurchaseTransferStatus = () => {
	const context = React.use(PurchaseTransferStatusContext)
	if (context === undefined) {
		throw new Error(
			'usePurchaseTransferStatus must be used within an PurchaseTransferStatusProvider',
		)
	}
	return context
}

// root

type RootProps = PurchaseTransferContextType & {
	className?: string
	asChild?: boolean
}

const Root: React.FC<React.PropsWithChildren<RootProps>> = ({
	children,
	asChild,
	className,
	...props
}) => {
	const Comp = asChild ? Slot : 'section'

	return (
		<PurchaseTransferProvider {...props}>
			<Comp className={cn('', className)}>
				{props.purchaseUserTransfers.map((purchaseUserTransfer) => {
					return (
						<PurchaseTransferStatusProvider
							purchaseUserTransfer={purchaseUserTransfer}
							key={purchaseUserTransfer.id}
						>
							{children}
						</PurchaseTransferStatusProvider>
					)
				})}
			</Comp>
		</PurchaseTransferProvider>
	)
}

// form context

type PurchaseTransferFormContextType = {
	register: UseFormRegister<PurchaseTransferFormData>
	handleSubmit: ReturnType<typeof useForm>['handleSubmit']
	onSubmit: (data: PurchaseTransferFormData) => void
	errors: FieldErrors<PurchaseTransferFormData>
	watch: UseFormWatch<PurchaseTransferFormData>
}

const PurchaseTransferFormContext = React.createContext<
	PurchaseTransferFormContextType | undefined
>(undefined)

export const PurchaseTransferFormProvider: React.FC<
	PurchaseTransferFormContextType & { children: React.ReactNode }
> = ({ children, ...props }) => {
	return (
		<PurchaseTransferFormContext.Provider value={props}>
			{children}
		</PurchaseTransferFormContext.Provider>
	)
}

export const usePurchaseTransferForm = () => {
	const context = React.use(PurchaseTransferFormContext)
	if (context === undefined) {
		throw new Error(
			'usePurchaseTransferForm must be used within an PurchaseTransferFormProvider',
		)
	}
	return context
}

type PurchaseTransferFormData = {
	email: string
}

const Header = ({
	children,
	className,
}: {
	children?: React.ReactNode
	className?: string
}) => {
	return (
		<h2 className={cn('text-primary pb-4 text-sm uppercase', className)}>
			{children || 'Transfer this purchase to another email address'}
		</h2>
	)
}

const Form = ({
	className,
	children,
}: {
	className?: string
	children?: React.ReactNode
}) => {
	const { initiatePurchaseTransfer } = usePurchaseTransfer()
	const { purchaseUserTransfer } = usePurchaseTransferStatus()
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
		await initiatePurchaseTransfer({
			email: data.email,
			purchaseUserTransferId: purchaseUserTransfer.id,
		})
		router.refresh()
	}

	return (
		<PurchaseTransferFormProvider
			register={register}
			handleSubmit={handleSubmit}
			onSubmit={onSubmit}
			errors={errors}
			watch={watch}
		>
			<form
				className={cn(
					'mt-3 flex w-full flex-col gap-2 text-left md:flex-row',
					className,
				)}
				onSubmit={handleSubmit(onSubmit)}
			>
				{children || (
					<>
						<InputLabel />
						<InputEmail />
						<SubmitButton />
					</>
				)}
			</form>
		</PurchaseTransferFormProvider>
	)
}

// form elements

const InputError = ({ children }: { children?: React.ReactNode }) => {
	return <span>{children}</span>
}

const InputLabel = ({
	children,
	className,
}: {
	children?: React.ReactNode
	className?: string
}) => {
	return (
		<label htmlFor="email" className={cn('sr-only', className)}>
			{children || 'Email'}
		</label>
	)
}

const InputEmail = ({ className }: { className?: string }) => {
	const { register } = usePurchaseTransferForm()
	return (
		<Input
			className={cn('w-full', className)}
			type="email"
			{...register('email', { required: true })}
			placeholder="somebody@example.com"
		/>
	)
}

const SubmitButton = ({ className, ...props }: { className?: string }) => {
	const { purchaseUserTransfer } = usePurchaseTransferStatus()
	const { errors, watch } = usePurchaseTransferForm()
	return (
		<>
			<Button
				className={cn('', className)}
				type="submit"
				variant="secondary"
				disabled={!purchaseUserTransfer || watch('email') === ''}
				{...props}
			>
				Transfer
			</Button>
			{errors.email && <InputError>This field is required</InputError>}
		</>
	)
}

const Title = ({
	children,
	asChild,
	className,
}: {
	children?: React.ReactNode
	asChild?: boolean
	className?: string
}) => {
	const Comp = asChild ? Slot : 'h2'
	const { purchaseUserTransfer } = usePurchaseTransferStatus()
	const STATE = purchaseUserTransfer.transferState
	const getTextForStatus = (state: PurchaseUserTransfer['transferState']) => {
		switch (state) {
			case 'AVAILABLE':
				return 'Transfer this purchase to another email address'
				break
			case 'INITIATED':
				return null
				break
			case 'COMPLETED':
				return null
			default:
				return null
				break
		}
	}
	return (
		<Comp className={cn('text-2xl font-medium', className)}>
			{children || getTextForStatus(STATE)}
		</Comp>
	)
}

const Description = ({
	children,
	className,
}: {
	children?: React.ReactNode
	className?: string
}) => {
	const { purchaseUserTransfer } = usePurchaseTransferStatus()
	const STATE = purchaseUserTransfer.transferState
	const getDescriptionForStatus = (
		state: PurchaseUserTransfer['transferState'],
	) => {
		switch (state) {
			case 'AVAILABLE':
				return (
					<>
						<p>
							You can transfer your purchase to another email address. We
							recommend using a personal/permanent email address. Once the
							transfer is complete you will no longer have access to the content
							or associated invoices from this account for this purchase.
						</p>
						<p>
							Only a single email transfer is provided per purchase as a
							courtesy!
						</p>
					</>
				)
				break
			case 'INITIATED':
				return (
					<p>
						This purchase is being transferred. Once accepted you will no longer
						have access to this purchase or its associated invoice. You can
						cancel the transfer at any time before it is accepted or expires.
					</p>
				)
				break
			case 'COMPLETED':
				return (
					<p>
						This purchase has been transferred. You no longer have access to
						this purchase or its associated invoice.
					</p>
				)
			default:
				return null
				break
		}
	}
	return (
		<div className={cn('prose dark:prose-invert w-full max-w-none', className)}>
			{children || getDescriptionForStatus(STATE)}
		</div>
	)
}

const Cancel = ({ className }: { className?: string }) => {
	const { cancelPurchaseTransfer } = usePurchaseTransfer()
	const { purchaseUserTransfer } = usePurchaseTransferStatus()
	const router = useRouter()

	return (
		<Button
			className={cn('mt-3', className)}
			variant="destructive"
			onClick={async () => {
				await cancelPurchaseTransfer({
					purchaseUserTransferId: purchaseUserTransfer.id,
				})
				router.refresh()
			}}
		>
			Cancel Transfer
		</Button>
	)
}

const Available = ({
	children,
	className,
}: {
	children?: React.ReactNode
	className?: string
}) => {
	const { purchaseUserTransfer } = usePurchaseTransferStatus()
	const STATE = purchaseUserTransfer.transferState

	return STATE === 'AVAILABLE' ? (
		<div className={cn('', className)}>
			{children || (
				<>
					<Title>Transfer this purchase to another email address</Title>
					<Description>
						<p>
							You can transfer your purchase to another email address. We
							recommend using a personal/permanent email address. Once the
							transfer is complete you will no longer have access to the content
							or associated invoices from this account for this purchase.
						</p>
						<p>
							Only a single email transfer is provided per purchase as a
							courtesy!
						</p>
					</Description>
					<Form key={purchaseUserTransfer.id} />
				</>
			)}
		</div>
	) : null
}

const Initiated = ({ children }: { children?: React.ReactNode }) => {
	const { purchaseUserTransfer } = usePurchaseTransferStatus()
	const { cancelPurchaseTransfer } = usePurchaseTransfer()
	const STATE = purchaseUserTransfer.transferState
	const router = useRouter()

	return STATE === 'INITIATED' ? (
		<>
			{children || (
				<>
					<h2 className="mb-3 text-2xl font-bold">
						This purchase is being transferred. Once accepted you will no longer
						have access to this purchase or its associated invoice. You can
						cancel the transfer at any time before it is accepted or expires.
					</h2>
					<Cancel />
				</>
			)}
		</>
	) : null
}

const Completed = ({ children }: { children?: React.ReactNode }) => {
	const { purchaseUserTransfer } = usePurchaseTransferStatus()
	const STATE = purchaseUserTransfer.transferState

	return STATE === 'COMPLETED' ? (
		<>
			{children || (
				<p className="text-balance">
					This purchase has been transferred. You no longer have access to this
					purchase or its associated invoice.
				</p>
			)}
		</>
	) : null
}

export {
	Root,
	Header,
	Form,
	Completed,
	Initiated,
	Available,
	Title,
	Description,
	Cancel,
	InputLabel,
	InputEmail,
	SubmitButton,
}

// export const PurchaseTransfer = ({
// 	bulkCouponId,
// 	purchaseUserTransfers,
// 	cancelPurchaseTransfer,
// 	initiatePurchaseTransfer,
// 	onTransferInitiated,
// }: {
// 	purchaseUserTransfers: PurchaseUserTransfer[]
// 	bulkCouponId?: string
// 	cancelPurchaseTransfer: (input: {
// 		purchaseUserTransferId: string
// 	}) => Promise<any>
// 	initiatePurchaseTransfer: (input: {
// 		email: string
// 		purchaseUserTransferId: string
// 	}) => Promise<any>
// 	onTransferInitiated: () => Promise<any>
// }) => {
// 	if (bulkCouponId) return null
// 	if (isEmpty(purchaseUserTransfers)) return null

// 	return (
// 		<div>
// 			{purchaseUserTransfers && (
// 				<PurchaseTransferStatus
// 					initiatePurchaseTransfer={initiatePurchaseTransfer}
// 					cancelPurchaseTransfer={cancelPurchaseTransfer}
// 					purchaseUserTransfers={purchaseUserTransfers}
// 					refetch={async () => {
// 						if (onTransferInitiated) {
// 							await onTransferInitiated()
// 						}
// 					}}
// 				/>
// 			)}
// 		</div>
// 	)
// }
