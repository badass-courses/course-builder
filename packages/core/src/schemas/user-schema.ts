import { z } from 'zod'

import { SubscriptionSchema } from './subscription'

export const userSchema = z.object({
	id: z.string().max(255),
	name: z.string().max(255).optional().nullable(),
	role: z.enum(['user', 'admin']).default('user'),
	email: z.string().max(255).email(),
	emailVerified: z.coerce.date().nullish(),
	image: z.string().max(255).optional().nullable(),
	createdAt: z.coerce.date().nullish(),
	memberships: z
		.array(
			z.object({
				id: z.string(),
				organizationId: z.string(),
			}),
		)
		.nullish()
		.default([]),
	roles: z
		.array(
			z.object({
				id: z.string(),
				name: z.string(),
				description: z.string().nullable(),
				active: z.boolean(),
				createdAt: z.coerce.date().nullish(),
				updatedAt: z.coerce.date().nullish(),
				deletedAt: z.coerce.date().nullish(),
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
				createdAt: z.coerce.date().nullish(),
				updatedAt: z.coerce.date().nullish(),
				deletedAt: z.coerce.date().nullish(),
			}),
		)
		.optional()
		.default([]),
	subscriptions: z.array(SubscriptionSchema.partial()).optional().default([]),
})

export type User = z.infer<typeof userSchema>
