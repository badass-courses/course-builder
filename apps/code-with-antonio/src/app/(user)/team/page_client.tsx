'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { TeamPageData } from '@/app/(user)/team/page'
import { CldImage } from '@/components/cld-image'
import {
	addSeatsToSubscription,
	claimSubscriptionSeat,
	inviteToSubscription,
	removeFromSubscription,
} from '@/lib/actions/team-subscription-actions'
import type { TeamSubscription } from '@/lib/team-subscriptions'
import { Trash2 } from 'lucide-react'

import { BuyMoreSeats } from '@coursebuilder/commerce-next/post-purchase/buy-more-seats'
import * as Pricing from '@coursebuilder/commerce-next/pricing/pricing'
import { ClaimedTeamSeats } from '@coursebuilder/commerce-next/team/claimed-team-seats'
import InviteTeam, {
	CopyInviteLinkButton,
	InviteLink,
	Root as InviteTeamRoot,
	SeatsAvailable,
	SelfRedeemButton,
} from '@coursebuilder/commerce-next/team/invite-team'
import { TeamMember, TeamSource } from '@coursebuilder/commerce-next/team/types'
import { Button, Card, Input } from '@coursebuilder/ui'
import { useToast } from '@coursebuilder/ui/primitives/use-toast'

/**
 * Team page template displaying both bulk purchases and subscription teams.
 */
export function TeamPageTemplate({
	bulkPurchases,
	teamSubscriptions,
	user,
}: TeamPageData) {
	const router = useRouter()

	const hasTeams =
		(bulkPurchases && bulkPurchases.length > 0) ||
		(teamSubscriptions && teamSubscriptions.length > 0)

	if (!hasTeams) {
		return (
			<div className="max-w-(--breakpoint-lg) mx-auto flex w-full flex-col items-center gap-8 px-5 py-20">
				<h1 className="text-xl font-bold">Your Team</h1>
				<p className="text-muted-foreground">
					You don&apos;t have any team purchases or subscriptions yet.
				</p>
			</div>
		)
	}

	return (
		<div className="max-w-(--breakpoint-lg) mx-auto flex w-full flex-col items-start gap-8 px-5 py-20 sm:gap-10 sm:py-16 md:flex-row lg:gap-16">
			<header className="w-full md:max-w-[230px]">
				<h1 className="text-center text-xl font-bold md:text-left">
					Your Team
				</h1>
			</header>
			<main className="divide-stroke flex w-full flex-col gap-5 divide-y md:max-w-lg">
				{/* Team Subscriptions */}
				{user &&
					teamSubscriptions?.map((teamSub) => (
						<SubscriptionTeamCard
							key={teamSub.subscription.id}
							teamSubscription={teamSub}
							userEmail={user.email}
							userHasClaimed={teamSub.userHasClaimed}
						/>
					))}

				{/* Bulk Purchases */}
				{user &&
					bulkPurchases?.map((purchase) => {
						const { bulkPurchase, pricingDataLoader } = purchase
						if (!bulkPurchase?.purchase)
							return <div key={purchase.bulkCoupon}>No bulk purchase found</div>

						const existingPurchase = bulkPurchase?.existingPurchase
						const bulkCoupon = purchase.bulkCoupon

						const redemptionsLeft =
							bulkCoupon &&
							bulkCoupon.maxUses > bulkCoupon.usedCount &&
							bulkCoupon.status === 1

						return (
							<div
								key={bulkPurchase.purchase.id}
								className="bg-card flex w-full flex-col gap-5 rounded border p-5"
							>
								<div className="flex flex-col gap-5">
									<div className="flex flex-col items-center gap-4 sm:flex-row">
										{bulkPurchase?.purchase?.product?.fields.image?.url && (
											<CldImage
												width={100}
												height={100}
												src={bulkPurchase?.purchase?.product?.fields.image?.url}
												alt={bulkPurchase?.purchase?.product?.name || ''}
											/>
										)}
										<h2 className="text-lg font-semibold">
											Invite your team to{' '}
											{bulkPurchase?.purchase?.product?.name}
										</h2>
									</div>
									<InviteTeam
										disabled={!redemptionsLeft}
										purchase={bulkPurchase.purchase}
										existingPurchase={existingPurchase}
										userEmail={user.email}
										className="flex flex-col items-start gap-y-2"
									/>
								</div>
								{purchase && (
									<ClaimedTeamSeats
										purchase={bulkPurchase.purchase}
										bulkCoupon={bulkCoupon}
									/>
								)}
								{user && bulkPurchase?.purchase?.product?.id && (
									<Pricing.Root
										className="relative w-full"
										product={bulkPurchase?.purchase?.product}
										couponId={bulkPurchase?.purchase?.couponId}
										userId={user.id}
										pricingDataLoader={pricingDataLoader}
									>
										<Pricing.Product className="flex w-full flex-col gap-2">
											<Pricing.BuyMoreSeats className="pt-5">
												<Pricing.TeamQuantityInput
													className="mb-0"
													label="Quantity"
												/>
												<Pricing.Price className="scale-75" />
												<Pricing.BuyButton>
													Buy Additional Seats
												</Pricing.BuyButton>
											</Pricing.BuyMoreSeats>
											<Pricing.BuyMoreSeatsToggle className="text-primary h-10 w-full px-5 py-3 text-sm" />
										</Pricing.Product>
									</Pricing.Root>
								)}
							</div>
						)
					})}
			</main>
		</div>
	)
}

/**
 * Card component for displaying a team subscription.
 */
function SubscriptionTeamCard({
	teamSubscription,
	userEmail,
	userHasClaimed,
}: {
	teamSubscription: TeamSubscription
	userEmail?: string | null
	userHasClaimed: boolean
}) {
	const { subscription, product, seats, members, ownerId } = teamSubscription
	const router = useRouter()
	const { toast } = useToast()
	const [inviteEmail, setInviteEmail] = React.useState('')
	const [isInviting, setIsInviting] = React.useState(false)
	const [showAddSeats, setShowAddSeats] = React.useState(false)
	const [seatsToAdd, setSeatsToAdd] = React.useState(1)
	const [isAddingSeats, setIsAddingSeats] = React.useState(false)

	// Build the source for the InviteTeam components
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
		}
		return result
	}

	const handleInvite = async (email: string) => {
		setIsInviting(true)
		try {
			const result = await inviteToSubscription({
				subscriptionId: subscription.id,
				email,
			})
			if (result.success) {
				setInviteEmail('')
				router.refresh()
				toast({ title: `Successfully invited ${email}` })
			}
			return result
		} finally {
			setIsInviting(false)
		}
	}

	const handleRemove = async (userId: string) => {
		const result = await removeFromSubscription({
			subscriptionId: subscription.id,
			userId,
		})
		if (result.success) {
			router.refresh()
			toast({ title: 'Member removed successfully' })
		}
		return result
	}

	const handleAddSeats = async () => {
		setIsAddingSeats(true)
		try {
			const result = await addSeatsToSubscription({
				subscriptionId: subscription.id,
				additionalSeats: seatsToAdd,
			})
			if (result.success) {
				router.refresh()
				setShowAddSeats(false)
				setSeatsToAdd(1)
				toast({ title: `Successfully added ${seatsToAdd} seat(s)` })
			} else {
				toast({ title: result.error || 'Failed to add seats' })
			}
		} finally {
			setIsAddingSeats(false)
		}
	}

	return (
		<div className="bg-card flex w-full flex-col gap-5 rounded border p-5">
			{/* Header */}
			<div className="flex flex-col items-center gap-4 sm:flex-row">
				{product?.fields?.image?.url && (
					<CldImage
						width={100}
						height={100}
						src={product.fields.image.url}
						alt={product?.name || ''}
					/>
				)}
				<div>
					<h2 className="text-lg font-semibold">
						Team Subscription: {product?.name}
					</h2>
					<p className="text-muted-foreground text-sm">
						{seats.used} of {seats.total} seats used
					</p>
				</div>
			</div>

			{/* Invite section using InviteTeam components */}
			<InviteTeamRoot
				source={source}
				userEmail={userEmail}
				existingClaim={userHasClaimed}
				disabled={seats.available === 0}
				onSelfClaim={handleSelfClaim}
				className="flex flex-col items-start gap-y-2"
			>
				<SeatsAvailable className="[&_span]:font-semibold" />
				{seats.available > 0 && !userHasClaimed && <SelfRedeemButton />}
			</InviteTeamRoot>

			{/* Direct invite by email */}
			{seats.available > 0 && (
				<div className="flex flex-col gap-2">
					<p className="text-sm font-medium">Invite team member by email:</p>
					<div className="flex gap-2">
						<Input
							type="email"
							placeholder="colleague@company.com"
							value={inviteEmail}
							onChange={(e) => setInviteEmail(e.target.value)}
						/>
						<Button
							variant="outline"
							disabled={!inviteEmail || isInviting}
							onClick={() => handleInvite(inviteEmail)}
						>
							{isInviting ? 'Inviting...' : 'Invite'}
						</Button>
					</div>
				</div>
			)}

			{/* Member list */}
			{members.length > 0 && (
				<div className="flex flex-col gap-2">
					<p className="text-sm font-medium">Team Members:</p>
					<div className="divide-border divide-y rounded border">
						{members.map((member) => (
							<div
								key={member.userId}
								className="flex items-center justify-between px-3 py-2"
							>
								<div>
									<span className="text-sm">{member.email}</span>
									{member.name && (
										<span className="text-muted-foreground ml-2 text-sm">
											({member.name})
										</span>
									)}
									{member.userId === ownerId && (
										<span className="text-muted-foreground ml-2 text-xs">
											(Owner)
										</span>
									)}
								</div>
								{member.userId !== ownerId && (
									<Button
										variant="ghost"
										size="sm"
										onClick={() => handleRemove(member.userId)}
									>
										<Trash2 className="h-4 w-4" />
									</Button>
								)}
							</div>
						))}
					</div>
				</div>
			)}

			{/* Add more seats */}
			<div className="border-t pt-4">
				{showAddSeats ? (
					<div className="flex flex-col gap-3">
						<p className="text-sm font-medium">Add More Seats</p>
						<div className="flex items-center gap-2">
							<Input
								type="number"
								min={1}
								value={seatsToAdd}
								onChange={(e) => setSeatsToAdd(Number(e.target.value))}
								className="w-24"
							/>
							<span className="text-muted-foreground text-sm">seat(s)</span>
						</div>
						<div className="flex gap-2">
							<Button
								onClick={handleAddSeats}
								disabled={isAddingSeats || seatsToAdd < 1}
							>
								{isAddingSeats ? 'Adding...' : 'Add Seats'}
							</Button>
							<Button
								variant="outline"
								onClick={() => {
									setShowAddSeats(false)
									setSeatsToAdd(1)
								}}
							>
								Cancel
							</Button>
						</div>
						<p className="text-muted-foreground text-xs">
							You will be charged a prorated amount for the additional seats.
						</p>
					</div>
				) : (
					<Button
						variant="outline"
						onClick={() => setShowAddSeats(true)}
						className="w-full"
					>
						Add More Seats
					</Button>
				)}
			</div>
		</div>
	)
}
