'use client'

import * as React from 'react'
import { usePathname } from 'next/navigation.js'
import { useQuery } from '@tanstack/react-query'
import { z } from 'zod'

import { buildStripeCheckoutPath } from '@coursebuilder/core/pricing/build-stripe-checkout-path'
import { FormattedPrice } from '@coursebuilder/core/types'

import { PriceDisplay } from '../pricing/price-display'
import { useDebounce } from '../utils/use-debounce'

const buyMoreSeatsSchema = z.object({
	productId: z.string(),
	userId: z.string(),
	buttonLabel: z.string().default('Buy').nullish(),
	className: z.string().optional(),
})

type BuyMoreSeatsProps = z.infer<typeof buyMoreSeatsSchema>
export const BuyMoreSeats = ({
	productId,
	userId,
	buttonLabel = 'Buy',
	className = '',
}: BuyMoreSeatsProps) => {
	const [quantity, setQuantity] = React.useState(5)
	const debouncedQuantity: number = useDebounce<number>(quantity, 250)
	const pathname = usePathname()
	const cancelUrl = process.env.NEXT_PUBLIC_URL + pathname

	const { data: formattedPrice, status } = useQuery({
		queryKey: ['prices-formatted', productId, debouncedQuantity],
		queryFn: async () => {
			return await fetch(
				`${process.env.NEXT_PUBLIC_URL}/api/coursebuilder/prices-formatted`,
				{
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
					},
					body: JSON.stringify({
						productId,
						quantity: debouncedQuantity,
					}),
				},
			).then(async (res) => {
				return (await res.json()) as FormattedPrice
			})
		},
	})

	return (
		<form
			data-buy-more-seats-form=""
			action={buildStripeCheckoutPath({
				userId,
				quantity: debouncedQuantity,
				productId,
				bulk: Boolean(formattedPrice?.bulk),
				couponId: formattedPrice?.appliedMerchantCoupon?.id,
				cancelUrl,
			})}
			method="POST"
			className={className}
		>
			<fieldset id="team-upgrade-pricing-inline">
				<div data-seats-form="">
					<label>Seats</label>
					<button
						type="button"
						aria-label="decrease seat quantity by one"
						onClick={() => {
							if (quantity === 1) return
							setQuantity(quantity - 1)
						}}
					>
						-
					</button>
					<input
						value={quantity}
						required={true}
						type="number"
						min={1}
						max={100}
						step={1}
						onChange={(e) => {
							const newQuantity = Number(e.target.value)
							setQuantity(newQuantity)
						}}
					/>
					<button
						type="button"
						aria-label="increase seat quantity by one"
						onClick={() => {
							if (quantity === 100) return
							setQuantity(quantity + 1)
						}}
					>
						+
					</button>
				</div>
				<div data-pricing-product="">
					<div data-pricing-product-header="">
						<PriceDisplay status={status} formattedPrice={formattedPrice} />
						<button type="submit" disabled={status !== 'success'}>
							{buttonLabel}
						</button>
					</div>
				</div>
			</fieldset>
		</form>
	)
}
