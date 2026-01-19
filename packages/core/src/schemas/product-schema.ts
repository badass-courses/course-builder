import { z } from 'zod'

import {
	ContentResourceProductSchema,
	ContentResourceSchema,
} from './content-resource-schema'
import { priceSchema } from './price-schema'

export const ProductTypeSchema = z
	.enum(['live', 'self-paced', 'membership', 'cohort', 'source-code-access'])
	.default('self-paced')
	.optional()

export type ProductType = z.infer<typeof ProductTypeSchema>

/**
 * Subscription tier for membership products.
 * - standard: Access to standard and free tier content
 * - pro: Access to all content including pro tier
 * - null: No tier specified (e.g., non-membership products)
 */
export const SubscriptionTierSchema = z.enum(['standard', 'pro']).nullable()

export type SubscriptionTier = z.infer<typeof SubscriptionTierSchema>

/**
 * Schema for billing interval on membership/subscription products
 */
export const BillingIntervalSchema = z
	.enum(['month', 'year'])
	.optional()
	.nullable()

export type BillingInterval = z.infer<typeof BillingIntervalSchema>

export const productSchema = z.object({
	id: z.string().max(191),
	organizationId: z.string().max(191).optional().nullable(),
	name: z.string().max(191),
	key: z.string().max(191).optional().nullable(),
	type: ProductTypeSchema,
	fields: z.object({
		body: z.string().nullable().optional(),
		description: z.string().nullish(),
		slug: z.string(),
		image: z
			.object({
				url: z.string(),
				alt: z.string().optional().nullable(),
				width: z.number().optional().nullable(),
				height: z.number().optional().nullable(),
			})
			.optional()
			.nullable(),
		action: z.string().optional().nullable().default('Buy Now'),
		state: z
			.enum(['draft', 'published', 'archived', 'deleted'])
			.default('draft'),
		visibility: z.enum(['public', 'private', 'unlisted']).default('unlisted'),
		openEnrollment: z.string().datetime().nullish(),
		closeEnrollment: z.string().datetime().nullish(),
		discordRoleId: z.string().optional().nullable(),
		/** Subscription tier for membership products (standard, pro) */
		tier: SubscriptionTierSchema,
		/** Billing interval for membership products (month, year) */
		billingInterval: BillingIntervalSchema,
	}),
	createdAt: z.coerce.date().nullable(),
	status: z.number().int().default(0),
	quantityAvailable: z.number().int().default(-1),
	price: priceSchema.nullable().optional(),
	resources: z.array(ContentResourceProductSchema).default([]).nullable(),
})

export type Product = z.infer<typeof productSchema>

/**
 * Schema for creating new products.
 * Includes `billingInterval` for membership products to configure recurring Stripe prices.
 */
export const NewProductSchema = z.object({
	name: z.string().min(2).max(90),
	quantityAvailable: z.coerce.number().default(-1),
	price: z.coerce.number().gte(0).default(0),
	type: ProductTypeSchema,
	state: z
		.enum(['draft', 'published', 'archived', 'deleted'])
		.default('draft')
		.optional(),
	visibility: z
		.enum(['public', 'private', 'unlisted'])
		.default('unlisted')
		.optional(),
	openEnrollment: z.string().datetime().nullish(),
	closeEnrollment: z.string().datetime().nullish(),
	/** Billing interval for membership/subscription products (defaults to 'year') */
	billingInterval: z.enum(['month', 'year']).optional(),
})

export type NewProduct = z.infer<typeof NewProductSchema>
