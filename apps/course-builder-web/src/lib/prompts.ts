import { z } from 'zod'

export const NewPromptSchema = z.object({
	title: z.string().min(2).max(90),
})
export type NewPrompt = z.infer<typeof NewPromptSchema>

export const PromptStateSchema = z.union([
	z.literal('draft'),
	z.literal('published'),
	z.literal('archived'),
	z.literal('deleted'),
])

export const PromptVisibilitySchema = z.union([
	z.literal('public'),
	z.literal('private'),
	z.literal('unlisted'),
])

export const PromptSchema = z.object({
	_id: z.string(),
	_type: z.literal('prompt'),
	_updatedAt: z.string(),
	_createdAt: z.string(),
	title: z.string().min(2).max(90),
	body: z.string().optional().nullable(),
	description: z.string().optional().nullable(),
	slug: z.string(),
	state: PromptStateSchema.default('draft'),
	visibility: PromptVisibilitySchema.default('unlisted'),
	model: z.string().default('gpt-4-turbo'),
	provider: z.string().default('openai'),
})

export type Prompt = z.infer<typeof PromptSchema>
