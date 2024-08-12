import type { Purchase } from '@coursebuilder/core/schemas'

export function bulkCouponHasSeats(coupon: Purchase['bulkCoupon']) {
	return coupon && coupon.usedCount < coupon.maxUses
}

export function hasChargesForPurchases(purchases?: Purchase[]) {
	return purchases?.some((purchase) => Boolean(purchase.merchantChargeId))
}

export function hasBulkPurchase(purchases?: Purchase[]) {
	return purchases?.some((purchase) => Boolean(purchase.bulkCoupon))
}

export function hasAvailableSeats(purchases?: Purchase[]) {
	return purchases?.some(
		(purchase) =>
			Boolean(purchase.bulkCoupon) && bulkCouponHasSeats(purchase.bulkCoupon),
	)
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
