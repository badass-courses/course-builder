import { z } from 'zod'

export const ChatResourceSchema = z.object({
	_id: z.string(),
	_type: z.string(),
	_updatedAt: z.string(),
	_createdAt: z.string(),
	title: z.string().nullable().optional(),
	body: z.string().nullable().optional(),
	transcript: z.string().nullable().optional(),
	wordLevelSrt: z.string().nullable().optional(),
})

export type ChatResource = z.infer<typeof ChatResourceSchema>
