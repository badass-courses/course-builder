'use client'

import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { Clipboard } from 'lucide-react'
import pluralize from 'pluralize'
import { useCopyToClipboard } from 'react-use'

import { Purchase } from '@coursebuilder/core/schemas'
import { Alert, Button, Input } from '@coursebuilder/ui'
import type { ButtonProps } from '@coursebuilder/ui/primitives/button'
import type { InputProps } from '@coursebuilder/ui/primitives/input'
import { useToast } from '@coursebuilder/ui/primitives/use-toast'
import { cn } from '@coursebuilder/ui/utils/cn'

import { handleSelfRedeem } from '../utils/handle-self-redeem'

export default function InviteTeam(props: RootProps) {
	return (
		<Root {...props}>
			<SeatsAvailable className="[&_span]:font-semibold" />
			<p>Send the following invite link to your colleagues to get started:</p>
			<div className="flex w-full items-center gap-2">
				<InviteLink />
				<CopyInviteLinkButton />
			</div>
			<SelfRedeemButton />
		</Root>
	)
}

type InviteTeamContextType = {
	purchase: Purchase
	existingPurchase?: Purchase | null
	disabled?: boolean
	userEmail?: string | null
}

type RootProps = InviteTeamContextType & {
	className?: string
}

type InnerContextType = {
	inviteLink: string
}

const InviteTeamContext = React.createContext<
	(InviteTeamContextType & InnerContextType) | undefined
>(undefined)

export const InviteTeamProvider: React.FC<
	InviteTeamContextType & { children: React.ReactNode; inviteLink: string }
> = ({ children, ...props }) => {
	return (
		<InviteTeamContext.Provider value={props}>
			{children}
		</InviteTeamContext.Provider>
	)
}

export const useInviteTeam = () => {
	const context = React.use(InviteTeamContext)
	if (context === undefined) {
		throw new Error('useInviteTeam must be used within an InviteTeamProvider')
	}
	return context
}

const Root: React.FC<React.PropsWithChildren<RootProps>> = ({
	children,
	className,
	...props
}) => {
	const code = props.purchase?.bulkCoupon?.id
	const inviteLink = `${process.env.NEXT_PUBLIC_URL}?code=${code}`

	return (
		<InviteTeamProvider {...props} inviteLink={inviteLink}>
			<section className={cn('w-full', className)}>{children}</section>
		</InviteTeamProvider>
	)
}

type SeatsAvailableProps = {
	asChild?: boolean
	className?: string
}

const SeatsAvailable: React.FC<
	React.PropsWithChildren<SeatsAvailableProps>
> = ({ children, asChild, className }) => {
	const { purchase } = useInviteTeam()
	const Comp = asChild ? Slot : 'p'
	const numberOfRedemptionsLeft =
		Number(purchase?.bulkCoupon?.maxUses) -
		Number(purchase?.bulkCoupon?.usedCount)
	return (
		<Comp className={cn('', className)}>
			You have{' '}
			<span>
				{numberOfRedemptionsLeft} team{' '}
				{pluralize('seat', numberOfRedemptionsLeft)} available.
			</span>
		</Comp>
	)
}

type InviteLinkProps = {
	className?: string
	asChild?: boolean

	[key: string]: InputProps[keyof InputProps]
}

const InviteLink: React.FC<React.PropsWithChildren<InviteLinkProps>> = ({
	children,
	asChild,
	className,
	...props
}) => {
	const Comp = asChild ? Slot : Input
	const { purchase, disabled = false, inviteLink } = useInviteTeam()

	return (
		<Comp
			className={cn('', className)}
			readOnly
			disabled={disabled}
			id="inviteLink"
			onClick={(e) => {
				if (disabled) return
				e.currentTarget.select()
			}}
			value={disabled ? 'Buy more seats' : inviteLink}
			{...props}
		/>
	)
}

type CopyInviteLinkButtonProps = {
	className?: string
	asChild?: boolean
	[key: string]: ButtonProps[keyof ButtonProps]
}

const CopyInviteLinkButton: React.FC<
	React.PropsWithChildren<CopyInviteLinkButtonProps>
> = ({
	children = <Clipboard className="h-4 w-4" aria-label="Copy to clipboard" />,
	asChild,
	className,
	...props
}) => {
	const Comp = asChild ? Slot : Button
	const { purchase, disabled = false, inviteLink } = useInviteTeam()

	const [_, setCopied] = useCopyToClipboard()
	const { toast } = useToast()

	return (
		<Comp
			variant="outline"
			size="icon"
			type="button"
			aria-label="Copy to clipboard"
			disabled={disabled}
			onClick={() => {
				setCopied(inviteLink)
				toast({ title: 'Link copied to clipboard' })
			}}
			{...props}
		>
			{children}
		</Comp>
	)
}

type SelfRedeemButtonProps = {
	className?: string
	asChild?: boolean
	[key: string]: ButtonProps[keyof ButtonProps]
}

const SelfRedeemButton: React.FC<
	React.PropsWithChildren<SelfRedeemButtonProps>
> = ({
	children = 'Claim 1 seat for yourself',
	asChild,
	className,
	...props
}) => {
	const Comp = asChild ? Slot : Button
	const {
		purchase,
		disabled = false,
		userEmail,
		existingPurchase,
	} = useInviteTeam()

	const [isLoading, setIsLoading] = React.useState(false)
	const { toast } = useToast()
	const [errorMessage, setErrorMessage] = React.useState<string | null>(null)
	const canRedeem = !existingPurchase
	return canRedeem ? (
		<>
			<Comp
				variant="outline"
				className={cn('text-primary w-full', className)}
				type="button"
				disabled={isLoading || disabled || !userEmail || !canRedeem}
				onClick={() => {
					if (userEmail) {
						setIsLoading(true)
						handleSelfRedeem(
							userEmail,
							purchase.bulkCoupon?.id as string,
							purchase.productId,
							(params) => {
								if (params.status === 'success') {
									console.log('redeemedPurchase', params.redeemedPurchase)

									toast({
										title:
											'Success! You have successfully redeemed a seat for yourself.',
									})
									setIsLoading(false)
								} else {
									setIsLoading(false)
									// TODO: report to sentry or support?
									console.debug(params.error)
									if (params.error.startsWith('already-purchased-')) {
										const message =
											'You have already redeemed a seat for yourself. Please contact support if you are having trouble accessing it.'
										setErrorMessage(message)
										toast({
											title: message,
										})
									} else {
										const message =
											'We were unable to redeem a seat for this account. If the issue persists, please reach out to support.'
										setErrorMessage(message)
										toast({
											title:
												'We were unable to redeem a seat for this account. If the issue persists, please reach out to support.',
										})
									}
								}
							},
						)
					}
				}}
				{...props}
			>
				{isLoading ? 'Claiming a seat...' : children}
			</Comp>
			{errorMessage && <Alert>{errorMessage}</Alert>}
		</>
	) : null
}

export {
	Root,
	SeatsAvailable,
	InviteLink,
	CopyInviteLinkButton,
	SelfRedeemButton,
}
