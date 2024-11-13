import { z } from 'zod'

import { productSchema } from './product-schema'

export const ContentResourceResourceSchema = z.object({
	resourceId: z.string(),
	resourceOfId: z.string(),
	position: z.number().default(0),
	metadata: z.record(z.string(), z.any()).default({}).nullable(),
	createdAt: z.coerce.date().nullable(),
	updatedAt: z.coerce.date().nullable(),
	deletedAt: z.coerce.date().nullable(),
	resource: z.any(),
})

export const ContentResourceSchema = z.object({
	id: z.string(),
	type: z.string(),
	createdById: z.string(),
	currentVersionId: z.string().nullish(),
	fields: z.record(z.string(), z.any()).default({}).nullable().optional(),
	createdAt: z.coerce.date().nullable(),
	updatedAt: z.coerce.date().nullable(),
	deletedAt: z.coerce.date().nullable(),
	resources: z.array(ContentResourceResourceSchema).default([]).nullable(),
	organizationId: z.string().nullish(),
})

export const ContentResourceProductSchema = z.object({
	resourceId: z.string(),
	productId: z.string(),
	position: z.number().default(0),
	metadata: z.record(z.string(), z.any()).default({}).nullable(),
	createdAt: z.coerce.date().nullable(),
	updatedAt: z.coerce.date().nullable(),
	deletedAt: z.coerce.date().nullable(),
	resource: z.any(),
	product: z.any(),
})

export type ContentResource = z.infer<typeof ContentResourceSchema>
export type ContentResourceResource = z.infer<
	typeof ContentResourceResourceSchema
>
export type ContentResourceProduct = z.infer<
	typeof ContentResourceProductSchema
>

export const ResourceStateSchema = z.union([
	z.literal('draft'),
	z.literal('published'),
	z.literal('archived'),
	z.literal('deleted'),
])

export const ResourceVisibilitySchema = z.union([
	z.literal('public'),
	z.literal('private'),
	z.literal('unlisted'),
])
