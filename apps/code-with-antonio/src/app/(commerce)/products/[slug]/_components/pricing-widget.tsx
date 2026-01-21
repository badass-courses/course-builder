import * as React from 'react'
import { SubscribeToConvertkitForm } from '@/convertkit'
import { track } from '@/utils/analytics'
import { toSnakeCase } from 'drizzle-orm/casing'
import { CheckCircle } from 'lucide-react'

import { useCoupon } from '@coursebuilder/commerce-next/coupons/use-coupon'
import * as Pricing from '@coursebuilder/commerce-next/pricing/pricing'
import { Product, Purchase } from '@coursebuilder/core/schemas'
import type {
	CommerceProps,
	FormattedPrice,
	PricingOptions,
} from '@coursebuilder/core/types'
import { cn } from '@coursebuilder/ui/utils/cn'

export type PricingData = {
	formattedPrice?: FormattedPrice | null
	purchaseToUpgrade?: Purchase | null
	quantityAvailable: number
}

export const PricingWidget: React.FC<{
	product: Product
	quantityAvailable: number
	commerceProps: CommerceProps
	pricingDataLoader: Promise<PricingData>
	hasPurchasedCurrentProduct?: boolean
	pricingWidgetOptions?: Partial<PricingOptions>
	ctaLabel?: string
}> = ({
	product,
	commerceProps,
	pricingDataLoader,
	pricingWidgetOptions,
	quantityAvailable,
	ctaLabel = 'Join Now',
}) => {
	const couponFromCode = commerceProps?.couponFromCode
	const { validCoupon } = useCoupon(couponFromCode)
	const couponId =
		commerceProps?.couponIdFromCoupon ||
		(validCoupon ? couponFromCode?.id : undefined)

	const waitlistCkFields = {
		// example: waitlist_mcp_workshop_ticket: "2025-04-17"
		[`waitlist_${toSnakeCase(product.name)}`]: new Date()
			.toISOString()
			.slice(0, 10),
	}

	return (
		<Pricing.Root
			className="relative w-full"
			product={product}
			couponId={couponId}
			options={pricingWidgetOptions}
			userId={commerceProps?.userId}
			pricingDataLoader={pricingDataLoader}
		>
			<Pricing.Product className="w-full">
				{/* <Pricing.ProductImage /> */}
				<Pricing.Details className="pt-0">
					<Pricing.Name />
					<Pricing.LiveQuantity className="bg-primary/10 text-primary px-2 pb-1 font-semibold" />
					<Pricing.Price />

					{pricingWidgetOptions?.allowTeamPurchase && (
						<>
							<Pricing.TeamToggle className='[&_button>span[data-state="checked"]]:bg-primary [&_button>span[data-state="unchecked"]]:bg-foreground/50' />
							<Pricing.TeamQuantityInput />
						</>
					)}
					<Pricing.BuyButton className="from-primary bg-linear-to-bl text-white! relative my-3 w-auto min-w-[260px] origin-bottom rounded-md to-indigo-800 px-6 py-6 text-lg font-semibold shadow-lg shadow-indigo-800/30 transition ease-in-out hover:hue-rotate-[8deg]">
						{product.type === 'membership' ? 'Subscribe' : ctaLabel}
					</Pricing.BuyButton>
					<Pricing.GuaranteeBadge />
					<Pricing.LiveRefundPolicy />
					<Pricing.SaleCountdown className="mt-5 [&_p]:pb-3" />
					<Pricing.PPPToggle />
				</Pricing.Details>
			</Pricing.Product>
			<Pricing.Waitlist className="border-foreground/5 mt-5 w-full border-t px-5">
				<p className="mb-3! text-balance pt-5 text-center text-lg font-medium leading-tight">
					Sold out. Get notified when the next date is announced.
				</p>
				<SubscribeToConvertkitForm
					fields={waitlistCkFields}
					actionLabel="Join Waitlist"
					className="w-ful [&_button]:from-primary [&_button]:bg-linear-to-b relative z-10 flex flex-col items-center justify-center gap-2 [&_button]:mt-1 [&_button]:h-12 [&_button]:w-full [&_button]:to-indigo-800 [&_button]:text-base [&_button]:font-semibold [&_button]:text-white [&_input]:h-12 [&_input]:text-lg"
					successMessage={
						<p className="inline-flex items-center text-center text-lg font-medium">
							<CheckCircle className="text-primary mr-2 size-5" /> You are on
							the waitlist
						</p>
					}
					onSuccess={(subscriber, email) => {
						const handleOnSuccess = (subscriber: any) => {
							if (subscriber) {
								track('waitlist_joined', {
									product_name: product.name,
									product_id: product.id,
									email: email,
								})

								return subscriber
							}
						}
						handleOnSuccess(subscriber)
					}}
				/>
			</Pricing.Waitlist>
		</Pricing.Root>
	)
}
