import { z } from 'zod'

export const entitlementSchema = z.object({
	id: z.string().max(191),
	entitlementType: z.string().max(255),
	userId: z.string().max(191).nullable().optional(),
	organizationId: z.string().max(191).nullable().optional(),
	organizationMembershipId: z.string().max(191).nullable().optional(),
	sourceType: z.string().max(255),
	sourceId: z.string().max(191),
	metadata: z.record(z.any()).default({}),
	expiresAt: z.date().nullable().optional(),
	createdAt: z.date().nullable().optional(),
	updatedAt: z.date().nullable().optional(),
	deletedAt: z.date().nullable().optional(),
})

export type Entitlement = z.infer<typeof entitlementSchema>
