import { z } from 'zod'

export const ContentResourceResourceSchema = z.object({
	resourceId: z.string(),
	resourceOfId: z.string(),
	position: z.number().default(0),
	metadata: z.record(z.string(), z.any()).default({}).nullable(),
	createdAt: z.date().nullable(),
	updatedAt: z.date().nullable(),
	deletedAt: z.date().nullable(),
	resource: z.any(),
})

export const ContentResourceSchema = z.object({
	id: z.string(),
	type: z.string(),
	createdById: z.string(),
	fields: z.record(z.string(), z.any()).default({}).nullable().optional(),
	createdAt: z.date().nullable(),
	updatedAt: z.date().nullable(),
	deletedAt: z.date().nullable(),
	resources: z.array(ContentResourceResourceSchema).default([]).nullable(),
})

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
