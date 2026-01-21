import type { Purchase } from '@coursebuilder/core/schemas'

/**
 * Team subscription seat info for ability checks.
 */
export type TeamSubscriptionSeatInfo = {
	subscriptionId: string
	totalSeats: number
	usedSeats: number
}

export function bulkCouponHasSeats(coupon: Purchase['bulkCoupon']) {
	return coupon && coupon.usedCount < coupon.maxUses
}

export function hasChargesForPurchases(purchases?: Purchase[]) {
	return purchases?.some((purchase) => Boolean(purchase.merchantChargeId))
}

export function hasBulkPurchase(purchases?: Purchase[]) {
	return purchases?.some((purchase) => Boolean(purchase.bulkCoupon))
}

/**
 * Checks if the user has any team subscriptions (for showing team menu).
 */
export function hasTeamSubscription(
	teamSubscriptions?: TeamSubscriptionSeatInfo[],
): boolean {
	return Boolean(teamSubscriptions && teamSubscriptions.length > 0)
}

/**
 * Checks if any bulk purchase or team subscription has available seats.
 */
export function hasAvailableSeats(
	purchases?: Purchase[],
	teamSubscriptions?: TeamSubscriptionSeatInfo[],
): boolean {
	const hasBulkSeats = Boolean(
		purchases?.some(
			(purchase) =>
				Boolean(purchase.bulkCoupon) && bulkCouponHasSeats(purchase.bulkCoupon),
		),
	)

	const hasSubscriptionSeats = Boolean(
		teamSubscriptions?.some((sub) => sub.usedSeats < sub.totalSeats),
	)

	return hasBulkSeats || hasSubscriptionSeats
}

export function hasValidPurchase(purchases?: Purchase[]) {
	return purchases?.some((purchase) => {
		return (
			(purchase &&
				!Boolean(purchase.bulkCoupon) &&
				purchase.status === 'Valid') ||
			purchase.status === 'Restricted'
		)
	})
}

export function hasInvoice(purchases?: Purchase[]) {
	return purchases?.some((purchase) => Boolean(purchase.merchantChargeId))
}
