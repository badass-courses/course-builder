import { z } from 'zod'

export const stripeInvoiceSchema = z.object({
	id: z.string(),
	object: z.literal('invoice'),
	subscription: z.string().optional(),
	charge: z.string().optional(),
	customer: z.string(),
	amount_paid: z.number(),
	currency: z.string(),
	status: z.enum(['paid', 'open', 'void', 'uncollectible']),
})

export const invoicePaymentSucceededEvent = z.object({
	id: z.string(),
	object: z.literal('event'),
	type: z.literal('invoice.payment_succeeded'),
	data: z.object({
		object: stripeInvoiceSchema,
	}),
})

export type InvoicePaymentSucceededEvent = z.infer<
	typeof invoicePaymentSucceededEvent
>
