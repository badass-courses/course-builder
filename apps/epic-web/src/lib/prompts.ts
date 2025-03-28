import { env } from '@/env.mjs'
import { z } from 'zod'

import { ContentResourceSchema } from '@coursebuilder/core/schemas/content-resource-schema'

export const NewPromptSchema = z.object({
	fields: z.object({
		title: z.string().min(2).max(90),
	}),
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

export const PromptSchema = ContentResourceSchema.merge(
	z.object({
		fields: z.object({
			title: z.string().min(2).max(90),
			body: z.string().optional().nullable(),
			description: z.string().optional().nullable(),
			slug: z.string(),
			state: PromptStateSchema.default('draft'),
			visibility: PromptVisibilitySchema.default('unlisted'),
			model: z.string().default(env.OPENAI_MODEL_ID),
			provider: z.string().default('openai'),
			forResourceType: z.string().optional().default('any'),
		}),
	}),
)

export type Prompt = z.infer<typeof PromptSchema>
