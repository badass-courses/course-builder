import { z } from 'zod'

export const userSchema = z.object({
	id: z.string().length(255),
	name: z.string().length(255).optional().nullable(),
	role: z.enum(['user', 'admin']).default('user'),
	email: z.string().length(255).email(),
	emailVerified: z.string().datetime().optional().nullable(),
	image: z.string().length(255).optional().nullable(),
	createdAt: z.string().default(() => new Date().toISOString()),
})

export type User = z.infer<typeof userSchema>
