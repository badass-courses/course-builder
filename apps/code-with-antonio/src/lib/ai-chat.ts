import { z } from 'zod'

export const ChatResourceSchema = z.object({
	id: z.string(),
	type: z.string(),
	updatedAt: z.string().nullable(),
	createdAt: z.string().nullable(),
	title: z.string().nullable().optional(),
	body: z.string().nullable().optional(),
	transcript: z.string().nullable().optional(),
	wordLevelSrt: z.string().nullable().optional(),
})

export type ChatResource = z.infer<typeof ChatResourceSchema>
