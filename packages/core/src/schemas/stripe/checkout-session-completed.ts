import { z } from 'zod'

const addressSchema = z.object({
	city: z.string().nullable(),
	country: z.string().nullable(),
	line1: z.string().nullable(),
	line2: z.string().nullable(),
	postal_code: z.string().nullable(),
	state: z.string().nullable(),
})

const customerDetailsSchema = z.object({
	address: addressSchema,
	email: z.string().nullable(),
	name: z.string().nullable(),
})

const dataObjectSchema = z.object({
	id: z.string(),
	object: z.literal('checkout.session'),
	amount_subtotal: z.number(),
	amount_total: z.number(),
	created: z.number(),
	currency: z.string(),
	custom_fields: z.array(z.unknown()),
	customer: z.string(),
	customer_details: customerDetailsSchema,
	livemode: z.boolean(),
	metadata: z.record(z.string()),
	mode: z.string(),
	payment_intent: z.string(),
	payment_method_collection: z.string(),
	payment_status: z.string(),
	phone_number_collection: z.object({ enabled: z.boolean() }),
	status: z.string(),
	success_url: z.string(),
	total_details: z.object({
		amount_discount: z.number(),
		amount_shipping: z.number(),
		amount_tax: z.number(),
	}),
})

const dataSchema = z.object({
	object: dataObjectSchema,
})

export const checkoutSessionCompletedEvent = z.object({
	id: z.string(),
	created: z.number(),
	data: dataSchema,
	type: z.literal('checkout.session.completed'),
})

export type CheckoutSessionCompletedEvent = z.infer<
	typeof checkoutSessionCompletedEvent
>
