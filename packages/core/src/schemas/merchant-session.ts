import { z } from 'zod'

export const MerchantSessionSchema = z.object({
	id: z.string(),
	organizationId: z.string().nullable(),
	identifier: z.string(),
	merchantAccountId: z.string(),
})

export type MerchantSession = z.infer<typeof MerchantSessionSchema>
