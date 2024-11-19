import type Stripe from 'stripe'
import { z } from 'zod'

import { CheckoutSessionMetadataSchema } from './stripe/checkout-session-metadata'

export const SubscriptionInfoSchema = z.object({
	customerIdentifier: z.string(),
	email: z.string().nullable(),
	name: z.string().nullish(),
	productIdentifier: z.string(),
	product: z.any() as z.ZodType<Stripe.Product>,
	subscriptionIdentifier: z.string(),
	priceIdentifier: z.string(),
	quantity: z.number(),
	status: z.string(),
	currentPeriodStart: z.date(),
	currentPeriodEnd: z.date(),
	metadata: CheckoutSessionMetadataSchema.optional(),
})

export type SubscriptionInfo = z.infer<typeof SubscriptionInfoSchema>
