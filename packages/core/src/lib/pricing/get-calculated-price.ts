type GetCalculatePriceOptions = {
	unitPrice: number
	percentOfDiscount?: number
	quantity?: number
	fixedDiscount?: number
}

/**
 * Calculates a total price for a given quantity with a fractional discount
 * applied.
 *
 * @param {string} unitPrice
 * @param {number} percentOfDiscount
 * @param {number} quantity
 * @param {number} fixedDiscount
 */
export function getCalculatedPrice({
	unitPrice,
	percentOfDiscount = 0,
	quantity = 1,
	fixedDiscount = 0,
}: GetCalculatePriceOptions) {
	const fullPrice = unitPrice * quantity
	const discountMultiplier = 1 - percentOfDiscount
	const calculatedPrice = (
		(fullPrice - fixedDiscount) *
		discountMultiplier
	).toFixed(2)

	console.log({ calculatedPrice, unitPrice, fullPrice, discountMultiplier })
	return Number(calculatedPrice)
}
