import React from 'react'
import { PriceDisplay } from '@/app/(content)/events/[slug]/_components/event-template'
import { buildStripeCheckoutPath } from '@/path-to-purchase/build-stripe-checkout-path'
import { api } from '@/trpc/react'
import { z } from 'zod'

export function useDebounce<T>(value: T, delay: number): T {
	// State and setters for debounced value
	const [debouncedValue, setDebouncedValue] = React.useState<T>(value)
	React.useEffect(
		() => {
			// Update debounced value after delay
			const handler = setTimeout(() => {
				setDebouncedValue(value)
			}, delay)
			// Cancel the timeout if value changes (also on delay change or unmount)
			// This is how we prevent debounced value from updating if value is changed ...
			// .. within the delay period. Timeout gets cleared and restarted.
			return () => {
				clearTimeout(handler)
			}
		},
		[value, delay], // Only re-call effect if value or delay changes
	)
	return debouncedValue
}

const buyMoreSeatsSchema = z.object({
	productId: z.string(),
	userId: z.string(),
	buttonLabel: z.string().default('Buy').nullish(),
	className: z.string().optional(),
})
type BuyMoreSeatsProps = z.infer<typeof buyMoreSeatsSchema>

const BuyMoreSeats = ({
	productId,
	userId,
	buttonLabel = 'Buy',
	className = '',
}: BuyMoreSeatsProps) => {
	const [quantity, setQuantity] = React.useState(5)
	const debouncedQuantity: number = useDebounce<number>(quantity, 250)

	const { data: formattedPrice, status } = api.pricing.formatted.useQuery({
		productId,
		quantity: debouncedQuantity,
	})

	const formActionPath = buildStripeCheckoutPath({
		userId,
		quantity: debouncedQuantity,
		productId,
		bulk: Boolean(formattedPrice?.bulk),
		couponId: formattedPrice?.appliedMerchantCoupon?.id,
	})

	return (
		<form
			data-buy-more-seats-form=""
			action={formActionPath}
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
						{formattedPrice && (
							<PriceDisplay status={status} formattedPrice={formattedPrice} />
						)}
						<button type="submit" disabled={false}>
							{buttonLabel}
						</button>
					</div>
				</div>
			</fieldset>
		</form>
	)
}

export default BuyMoreSeats
