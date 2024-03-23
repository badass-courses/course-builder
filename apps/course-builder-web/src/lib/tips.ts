import { z } from 'zod'

export const TipStateSchema = z.union([
	z.literal('draft'),
	z.literal('published'),
	z.literal('archived'),
	z.literal('deleted'),
])

export const TipVisibilitySchema = z.union([
	z.literal('public'),
	z.literal('private'),
	z.literal('unlisted'),
])

export const TipSchema = z.object({
	id: z.string(),
	type: z.literal('tip'),
	updatedAt: z.string(),
	createdAt: z.string(),
	title: z.string(),
	summary: z.string().optional().nullable(),
	body: z.string().nullable().optional(),
	videoResourceId: z.string().nullable().optional(),
	state: TipStateSchema.default('draft'),
	visibility: TipVisibilitySchema.default('unlisted'),
	slug: z.string(),
})

export type Tip = z.infer<typeof TipSchema>

export const NewTipSchema = z.object({
	title: z.string().min(2).max(90),
	videoResourceId: z.string().min(4, 'Please upload a video'),
})

export type NewTip = z.infer<typeof NewTipSchema>

export const TipUpdateSchema = z.object({
	id: z.string(),
	title: z.string().min(2).max(90),
	body: z.string().optional().nullable(),
})

export type TipUpdate = z.infer<typeof TipUpdateSchema>
