'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import {
	claimSubscriptionSeat,
	inviteToSubscription,
	removeFromSubscription,
} from '@/lib/actions/team-subscription-actions'
import type { TeamSubscription } from '@/lib/team-subscriptions'

import {
	CopyInviteLinkButton,
	InviteLink,
	Root as InviteTeamRoot,
	SeatsAvailable,
	SelfRedeemButton,
} from '@coursebuilder/commerce-next/team/invite-team'
import type { TeamSource } from '@coursebuilder/commerce-next/team/types'
import type { Product } from '@coursebuilder/core/schemas/product-schema'
import type { Subscription } from '@coursebuilder/core/schemas/subscription'
import { useToast } from '@coursebuilder/ui/primitives/use-toast'

/**
 * Props for the WelcomeTeamWidget component.
 */
interface WelcomeTeamWidgetProps {
	teamSubscription: TeamSubscription & { userHasClaimed: boolean }
	userEmail?: string | null
}

/**
 * Team invite widget for the welcome page.
 * Handles team seat invitations for bulk subscription purchases.
 */
export function WelcomeTeamWidget({
	teamSubscription,
	userEmail,
}: WelcomeTeamWidgetProps) {
	const router = useRouter()
	const { toast } = useToast()

	const { subscription, product, seats, members, ownerId, userHasClaimed } =
		teamSubscription

	// Build the source for InviteTeam components, mapping our types to commerce-next types
	const source: TeamSource = {
		type: 'subscription',
		subscription,
		product,
		members: members.map((m) => ({
			id: m.userId,
			email: m.email,
			name: m.name,
			joinedAt: m.joinedAt,
			sourceId: m.entitlementId,
		})),
		ownerId,
		totalSeats: seats.total,
	}

	const handleSelfClaim = async () => {
		const result = await claimSubscriptionSeat({
			subscriptionId: subscription.id,
		})

		if (result.success) {
			router.refresh()
			toast({ title: 'Successfully claimed your seat!' })
		} else {
			toast({ title: result.error || 'Failed to claim seat' })
		}
		return result
	}

	const handleInvite = async (email: string) => {
		const result = await inviteToSubscription({
			subscriptionId: subscription.id,
			email,
		})

		if (result.success) {
			router.refresh()
			toast({ title: `Successfully invited ${email}` })
		} else {
			toast({ title: result.error || 'Failed to send invite' })
		}
		return result
	}

	const handleRemove = async (userId: string) => {
		const result = await removeFromSubscription({
			subscriptionId: subscription.id,
			userId,
		})

		if (result.success) {
			router.refresh()
			toast({ title: 'Member removed successfully' })
		} else {
			toast({ title: result.error || 'Failed to remove member' })
		}
		return result
	}

	return (
		<div className="border-b pb-5">
			<h2 className="text-primary pb-4 text-sm uppercase">Invite Your Team</h2>
			<div className="flex flex-col gap-4">
				<InviteTeamRoot
					source={source}
					userEmail={userEmail}
					existingClaim={userHasClaimed}
					disabled={seats.available === 0}
					onSelfClaim={handleSelfClaim}
					onInvite={handleInvite}
					onRemove={handleRemove}
					className="flex flex-col items-start gap-y-3"
				>
					<SeatsAvailable className="[&_span]:font-semibold" />
					{seats.available > 0 && (
						<>
							<p className="text-muted-foreground text-sm">
								Send this invite link to your colleagues:
							</p>
							<div className="flex w-full items-center gap-2">
								<InviteLink className="flex-1" />
								<CopyInviteLinkButton />
							</div>
							{!userHasClaimed && <SelfRedeemButton className="mt-2" />}
						</>
					)}
				</InviteTeamRoot>

				{/* Show team members if any have joined */}
				{members.length > 0 && (
					<div className="mt-2">
						<p className="text-muted-foreground mb-2 text-sm">
							Team members ({members.length}/{seats.total}):
						</p>
						<div className="divide-border divide-y rounded border text-sm">
							{members.map((member) => (
								<div
									key={member.userId}
									className="flex items-center justify-between px-3 py-2"
								>
									<span>{member.email}</span>
									{member.userId === ownerId && (
										<span className="text-muted-foreground text-xs">
											(Owner)
										</span>
									)}
								</div>
							))}
						</div>
					</div>
				)}
			</div>
		</div>
	)
}
