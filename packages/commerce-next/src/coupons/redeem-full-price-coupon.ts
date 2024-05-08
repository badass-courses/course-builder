export async function redeemFullPriceCoupon({
	email,
	couponId,
	productIds,
	sendEmail = true,
}: {
	email: string
	couponId: string
	productIds: string[]
	sendEmail?: boolean
}) {
	return await fetch(`/api/coursebuilder/redeem/coupon`, {
		method: 'post',
		body: JSON.stringify({
			email,
			couponId,
			productIds,
			sendEmail,
		}),
		headers: {
			'Content-Type': 'application/json',
		},
	}).then((response) => response.json())
}
