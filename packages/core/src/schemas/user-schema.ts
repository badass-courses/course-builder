import { z } from 'zod'

export const userSchema = z.object({
	id: z.string().max(255),
	name: z.string().max(255).optional().nullable(),
	role: z.enum(['user', 'admin']).default('user'),
	email: z.string().max(255).email(),
	emailVerified: z.coerce.date().nullable(),
	image: z.string().max(255).optional().nullable(),
	createdAt: z.coerce.date().nullable(),
	memberships: z
		.array(
			z.object({
				id: z.string(),
				organizationId: z.string(),
			}),
		)
		.optional()
		.default([]),
	roles: z
		.array(
			z.object({
				id: z.string(),
				name: z.string(),
				description: z.string().nullable(),
				active: z.boolean(),
			}),
		)
		.optional()
		.default([]),
	organizationRoles: z
		.array(
			z.object({
				id: z.string(),
				organizationId: z.string(),
				name: z.string(),
				description: z.string().nullable(),
				active: z.boolean(),
			}),
		)
		.optional()
		.default([]),
})

export type User = z.infer<typeof userSchema>
