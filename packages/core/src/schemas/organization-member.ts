import { z } from 'zod'

export const OrganizationMemberSchema = z.object({
	id: z.string(),
	organizationId: z.string().optional(),
	role: z.string().default('user'),
	invitedById: z.string(),
	userId: z.string(),
	fields: z.record(z.any()).default({}),
	createdAt: z.date().default(() => new Date()),
})

export type OrganizationMember = z.infer<typeof OrganizationMemberSchema>
