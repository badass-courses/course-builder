import { z } from 'zod'

export const OrganizationSchema = z.object({
	id: z.string(),
	name: z.string().nullable(),
	fields: z.record(z.any()).default({}),
	image: z.string().nullable(),
	createdAt: z.date(),
})

export type Organization = z.infer<typeof OrganizationSchema>
