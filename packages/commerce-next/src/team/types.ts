import type { Product } from '@coursebuilder/core/schemas/product-schema'
import type { Purchase } from '@coursebuilder/core/schemas/purchase-schema'
import type { Subscription } from '@coursebuilder/core/schemas/subscription'

/**
 * Represents a team member who has claimed a seat.
 * Used for both bulk purchases and subscriptions.
 */
export type TeamMember = {
	id: string
	email: string
	name?: string | null
	joinedAt: Date
	/**
	 * For bulk purchases: the purchase ID
	 * For subscriptions: the entitlement ID
	 */
	sourceId: string
}

/**
 * Computed seat information for any team source.
 */
export type SeatInfo = {
	/** Total seats available (maxUses for bulk, seats field for subscriptions) */
	total: number
	/** Seats that have been claimed */
	used: number
	/** Seats remaining to be claimed */
	available: number
}

/**
 * Unified interface for team seat sources.
 * Allows components to work with both bulk purchases and subscriptions.
 */
export type TeamSource =
	| {
			type: 'bulk-purchase'
			purchase: Purchase
			existingPurchase?: Purchase | null
	  }
	| {
			type: 'subscription'
			subscription: Subscription
			product: Product
			members: TeamMember[]
			ownerId: string
			/** Total seats from subscription.fields.seats */
			totalSeats: number
	  }

/**
 * Computes seat information from any team source.
 *
 * @param source - The team source (bulk purchase or subscription)
 * @returns Seat allocation information
 */
export function getSeatInfo(source: TeamSource): SeatInfo {
	if (source.type === 'bulk-purchase') {
		const total = source.purchase.bulkCoupon?.maxUses ?? 0
		const used = source.purchase.bulkCoupon?.usedCount ?? 0
		return {
			total,
			used,
			available: total - used,
		}
	}

	// Subscription source - seats come from the source
	const total = source.totalSeats
	const used = source.members.length
	return {
		total,
		used,
		available: total - used,
	}
}

/**
 * Generates an invite link for the given team source.
 *
 * @param source - The team source
 * @param baseUrl - The base URL for the invite link
 * @returns The invite link URL
 */
export function getInviteLink(source: TeamSource, baseUrl: string): string {
	if (source.type === 'bulk-purchase') {
		const code = source.purchase.bulkCoupon?.id
		return `${baseUrl}?code=${code}`
	}

	// For subscriptions, we use a subscription-specific invite path
	return `${baseUrl}/team/join/${source.subscription.id}`
}
