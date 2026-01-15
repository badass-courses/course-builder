'use client'

import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { Clipboard } from 'lucide-react'
import pluralize from 'pluralize'
import { useCopyToClipboard } from 'react-use'

import type { Purchase } from '@coursebuilder/core/schemas'
import { Alert, Button, Input } from '@coursebuilder/ui'
import type { ButtonProps } from '@coursebuilder/ui/primitives/button'
import type { InputProps } from '@coursebuilder/ui/primitives/input'
import { useToast } from '@coursebuilder/ui/primitives/use-toast'
import { cn } from '@coursebuilder/ui/utils/cn'

import { handleSelfRedeem } from '../utils/handle-self-redeem'
import {
	getInviteLink,
	getSeatInfo,
	type SeatInfo,
	type TeamSource,
} from './types'

/**
 * Default InviteTeam component with standard layout.
 * Supports both bulk purchases and subscription sources.
 */
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

/**
 * Callback result for subscription actions
 */
export type ActionResult = {
	success: boolean
	error?: string
}

/**
 * Context type for InviteTeam component tree.
 * Supports both legacy purchase-based and new source-based approaches.
 */
type InviteTeamContextType = {
	// Legacy props (for backwards compatibility)
	purchase?: Purchase
	existingPurchase?: Purchase | null
	// New unified source
	source?: TeamSource
	// Computed values
	seatInfo: SeatInfo
	inviteLink: string
	// State
	disabled?: boolean
	userEmail?: string | null
	existingClaim?: boolean
	// Callbacks for subscription actions
	onSelfClaim?: () => Promise<ActionResult>
	onInvite?: (email: string) => Promise<ActionResult>
	onRemove?: (userId: string) => Promise<ActionResult>
}

type RootProps = {
	className?: string
	disabled?: boolean
	userEmail?: string | null
	existingClaim?: boolean
	children?: React.ReactNode
} & (
	| {
			// Legacy: bulk purchase only
			purchase: Purchase
			existingPurchase?: Purchase | null
			source?: never
			onSelfClaim?: never
			onInvite?: never
			onRemove?: never
	  }
	| {
			// New: unified source
			source: TeamSource
			purchase?: never
			existingPurchase?: never
			onSelfClaim?: () => Promise<ActionResult>
			onInvite?: (email: string) => Promise<ActionResult>
			onRemove?: (userId: string) => Promise<ActionResult>
	  }
)

const InviteTeamContext = React.createContext<
	InviteTeamContextType | undefined
>(undefined)

/**
 * Provider for InviteTeam context.
 * Allows custom context injection for testing or advanced use cases.
 */
export const InviteTeamProvider: React.FC<
	InviteTeamContextType & { children: React.ReactNode }
> = ({ children, ...props }) => {
	return (
		<InviteTeamContext.Provider value={props}>
			{children}
		</InviteTeamContext.Provider>
	)
}

/**
 * Hook to access InviteTeam context.
 * Must be used within InviteTeam.Root or InviteTeamProvider.
 */
export const useInviteTeam = () => {
	const context = React.use(InviteTeamContext)
	if (context === undefined) {
		throw new Error('useInviteTeam must be used within an InviteTeamProvider')
	}
	return context
}

/**
 * Root component for InviteTeam compound component.
 * Sets up context for child components.
 */
const Root: React.FC<RootProps> = ({
	children,
	className,
	disabled,
	userEmail,
	existingClaim,
	...props
}) => {
	const baseUrl = process.env.NEXT_PUBLIC_URL ?? ''

	// Handle both legacy and new source approaches
	let source: TeamSource
	let seatInfo: SeatInfo
	let inviteLink: string

	if ('source' in props && props.source) {
		// New source-based approach
		source = props.source
		seatInfo = getSeatInfo(source)
		inviteLink = getInviteLink(source, baseUrl)
	} else if ('purchase' in props && props.purchase) {
		// Legacy purchase-based approach
		source = {
			type: 'bulk-purchase',
			purchase: props.purchase,
			existingPurchase: props.existingPurchase,
		}
		seatInfo = getSeatInfo(source)
		inviteLink = getInviteLink(source, baseUrl)
	} else {
		throw new Error('InviteTeam.Root requires either source or purchase prop')
	}

	const contextValue: InviteTeamContextType = {
		source,
		purchase: source.type === 'bulk-purchase' ? source.purchase : undefined,
		existingPurchase:
			source.type === 'bulk-purchase' ? source.existingPurchase : undefined,
		seatInfo,
		inviteLink,
		disabled,
		userEmail,
		existingClaim,
		...('onSelfClaim' in props && { onSelfClaim: props.onSelfClaim }),
		...('onInvite' in props && { onInvite: props.onInvite }),
		...('onRemove' in props && { onRemove: props.onRemove }),
	}

	return (
		<InviteTeamProvider {...contextValue}>
			<section className={cn('w-full', className)}>{children}</section>
		</InviteTeamProvider>
	)
}

type SeatsAvailableProps = {
	asChild?: boolean
	className?: string
}

/**
 * Displays the number of available seats.
 * Works with both bulk purchases and subscriptions.
 */
const SeatsAvailable: React.FC<
	React.PropsWithChildren<SeatsAvailableProps>
> = ({ children, asChild, className }) => {
	const { seatInfo } = useInviteTeam()
	const Comp = asChild ? Slot : 'p'

	return (
		<Comp className={cn('', className)}>
			You have{' '}
			<span>
				{seatInfo.available} team {pluralize('seat', seatInfo.available)}{' '}
				available.
			</span>
		</Comp>
	)
}

type InviteLinkProps = {
	className?: string
	asChild?: boolean
	[key: string]: InputProps[keyof InputProps]
}

/**
 * Input field displaying the invite link.
 */
const InviteLink: React.FC<React.PropsWithChildren<InviteLinkProps>> = ({
	children,
	asChild,
	className,
	...props
}) => {
	const Comp = asChild ? Slot : Input
	const { disabled = false, inviteLink } = useInviteTeam()

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

/**
 * Button to copy the invite link to clipboard.
 */
const CopyInviteLinkButton: React.FC<
	React.PropsWithChildren<CopyInviteLinkButtonProps>
> = ({
	children = <Clipboard className="h-4 w-4" aria-label="Copy to clipboard" />,
	asChild,
	className,
	...props
}) => {
	const Comp = asChild ? Slot : Button
	const { disabled = false, inviteLink } = useInviteTeam()

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

/**
 * Button for the current user to claim a seat for themselves.
 * Handles both bulk purchase (coupon-based) and subscription (entitlement-based) redemption.
 */
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
		source,
		purchase,
		disabled = false,
		userEmail,
		existingPurchase,
		existingClaim,
		onSelfClaim,
	} = useInviteTeam()

	const [isLoading, setIsLoading] = React.useState(false)
	const { toast } = useToast()
	const [errorMessage, setErrorMessage] = React.useState<string | null>(null)

	// Determine if user can redeem based on source type
	const canRedeem =
		source?.type === 'subscription' ? !existingClaim : !existingPurchase

	if (!canRedeem) return null

	const handleClick = async () => {
		if (!userEmail) return

		setIsLoading(true)
		setErrorMessage(null)

		try {
			if (source?.type === 'subscription' && onSelfClaim) {
				// Subscription: use callback
				const result = await onSelfClaim()

				if (result.success) {
					toast({
						title:
							'Success! You have successfully claimed a seat for yourself.',
					})
				} else {
					const message =
						result.error ||
						'We were unable to claim a seat for this account. Please try again.'
					setErrorMessage(message)
					toast({ title: message })
				}
			} else if (source?.type === 'bulk-purchase' || purchase) {
				// Bulk purchase: use existing handler
				const targetPurchase = purchase ?? (source as any)?.purchase
				handleSelfRedeem(
					userEmail,
					targetPurchase?.bulkCoupon?.id as string,
					targetPurchase?.productId,
					(params) => {
						if (params.status === 'success') {
							toast({
								title:
									'Success! You have successfully redeemed a seat for yourself.',
							})
						} else {
							console.debug(params.error)
							if (params.error.startsWith('already-purchased-')) {
								const message =
									'You have already redeemed a seat for yourself. Please contact support if you are having trouble accessing it.'
								setErrorMessage(message)
								toast({ title: message })
							} else {
								const message =
									'We were unable to redeem a seat for this account. If the issue persists, please reach out to support.'
								setErrorMessage(message)
								toast({ title: message })
							}
						}
					},
				)
			}
		} finally {
			setIsLoading(false)
		}
	}

	return (
		<div className={cn('flex flex-col gap-2', className)}>
			<Comp
				variant="outline"
				className="text-primary w-full"
				type="button"
				disabled={isLoading || disabled || !userEmail || !canRedeem}
				onClick={handleClick}
				{...props}
			>
				{isLoading ? 'Claiming a seat...' : children}
			</Comp>
			{errorMessage && <Alert>{errorMessage}</Alert>}
		</div>
	)
}

export {
	Root,
	SeatsAvailable,
	InviteLink,
	CopyInviteLinkButton,
	SelfRedeemButton,
}
