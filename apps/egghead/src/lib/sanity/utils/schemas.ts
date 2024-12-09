import * as z from 'zod'

export const ImageSchema = z.object({
	_type: z.string().optional(),
	label: z.string().optional(),
	url: z.string().optional(),
	_key: z.string().optional(),
})
export type Image = z.infer<typeof ImageSchema>

export const SlugSchema = z.object({
	current: z.string().optional(),
	_type: z.string().optional(),
})
export type Slug = z.infer<typeof SlugSchema>

export const ReferenceSchema = z.object({
	_ref: z.string().optional(),
	_type: z.string().optional(),
	_key: z.string().optional(),
})
export type Reference = z.infer<typeof ReferenceSchema>

export const SystemFieldsSchema = z.object({
	_id: z.string().optional(),
	_type: z.string().optional(),
	_rev: z.string().optional(),
	_createdAt: z.coerce.date().optional(),
	_updatedAt: z.coerce.date().optional(),
})
export type SystemFields = z.infer<typeof SystemFieldsSchema>
