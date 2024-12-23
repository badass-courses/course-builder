import { z } from 'zod'

import { OrganizationSchema } from './organization-schema'
import { userSchema } from './user-schema'

export const OrganizationMemberSchema = z.object({
	id: z.string(),
	organizationId: z.string().optional(),
	role: z.string().default('user'),
	invitedById: z.string(),
	userId: z.string(),
	fields: z.record(z.any()).default({}),
	createdAt: z.date().default(() => new Date()),
	organization: OrganizationSchema,
	user: userSchema,
})

export type OrganizationMember = z.infer<typeof OrganizationMemberSchema>
