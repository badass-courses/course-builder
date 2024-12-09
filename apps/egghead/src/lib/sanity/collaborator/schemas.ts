import * as z from 'zod'

import { ReferenceSchema, SystemFieldsSchema } from '../utils/schemas'

export const SanityCollaboratorSchema = z.object({
	...SystemFieldsSchema.shape,
	person: ReferenceSchema.optional(),
	title: z.string().optional(),
	eggheadInstructorId: z.string().optional(),
	role: z.string().optional(),
	department: z.string().optional(),
})
export type SanityCollaborator = z.infer<typeof SanityCollaboratorSchema>
