'use server'

import { revalidatePath } from 'next/cache'

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
	return await fetch(
		`${process.env.NEXT_PUBLIC_URL}/api/coursebuilder/redeem/coupon`,
		{
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
		},
	).then((response) => {
		revalidatePath('/')
		return response.json()
	})
}
