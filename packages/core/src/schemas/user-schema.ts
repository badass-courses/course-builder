import { z } from 'zod'

export const userSchema = z.object({
	id: z.string().max(255),
	name: z.string().max(255).optional().nullable(),
	role: z.enum(['user', 'admin']).default('user'),
	email: z.string().max(255).email(),
	emailVerified: z.coerce.date().nullable(),
	image: z.string().max(255).optional().nullable(),
	createdAt: z.coerce.date().nullable(),
})

export type User = z.infer<typeof userSchema>
