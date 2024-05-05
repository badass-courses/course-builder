'use client'

import * as React from 'react'
import { use } from 'react'
import { usePathname } from 'next/navigation'
import { PricingData } from '@/lib/pricing-query'
import { buildStripeCheckoutPath } from '@/path-to-purchase/build-stripe-checkout-path'
import { PriceDisplay } from '@/pricing/price-display'
import { useDebounce } from '@/pricing/use-debounce'
import { api } from '@/trpc/react'
import { z } from 'zod'

const buyMoreSeatsSchema = z.object({
	productId: z.string(),
	userId: z.string(),
	buttonLabel: z.string().default('Buy').nullish(),
	className: z.string().optional(),
})

type BuyMoreSeatsProps = z.infer<typeof buyMoreSeatsSchema> & {
	pricingDataLoader: Promise<PricingData>
}
export const BuyMoreSeats = ({
	productId,
	userId,
	buttonLabel = 'Buy',
	className = '',
	pricingDataLoader,
}: BuyMoreSeatsProps) => {
	const [quantity, setQuantity] = React.useState(5)
	const debouncedQuantity: number = useDebounce<number>(quantity, 250)
	const pathname = usePathname()
	const cancelUrl = process.env.NEXT_PUBLIC_URL + pathname

	const { data: formattedPrice, status } = api.pricing.formatted.useQuery({
		productId,
		quantity: debouncedQuantity,
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
						<PriceDisplay status={'success'} formattedPrice={formattedPrice} />
						<button type="submit" disabled={status !== 'success'}>
							{buttonLabel}
						</button>
					</div>
				</div>
			</fieldset>
		</form>
	)
}
