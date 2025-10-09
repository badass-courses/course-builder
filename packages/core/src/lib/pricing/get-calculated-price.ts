type GetCalculatePriceOptions = {
	unitPrice: number
	percentOfDiscount?: number
	quantity?: number
	fixedDiscount?: number
	amountDiscount?: number
}

/**
 * Calculates a total price for a given quantity with discounts applied.
 *
 * @param {number} unitPrice - Unit price of the product
 * @param {number} percentOfDiscount - Percentage discount (0-1) from merchant coupon
 * @param {number} quantity - Quantity being purchased
 * @param {number} fixedDiscount - Fixed discount for upgrades
 * @param {number} amountDiscount - Fixed amount discount (in cents) from merchant coupon
 */
export function getCalculatedPrice({
	unitPrice,
	percentOfDiscount = 0,
	quantity = 1,
	fixedDiscount = 0,
	amountDiscount = 0,
}: GetCalculatePriceOptions) {
	const fullPrice = unitPrice * quantity

	// Apply upgrade discount first
	const priceAfterUpgradeDiscount = fullPrice - fixedDiscount

	// Apply merchant coupon discount - either percentage or fixed amount, but not both
	let finalPrice: number
	if (amountDiscount > 0) {
		// Fixed amount discount from merchant coupon (convert from cents to dollars)
		const amountDiscountInDollars = amountDiscount / 100
		finalPrice = priceAfterUpgradeDiscount - amountDiscountInDollars
	} else {
		// Percentage discount from merchant coupon
		const discountMultiplier = 1 - percentOfDiscount
		finalPrice = priceAfterUpgradeDiscount * discountMultiplier
	}

	// Clamp negative prices to 0
	const clampedPrice = Math.max(0, finalPrice)

	return Number(clampedPrice.toFixed(2))
}
