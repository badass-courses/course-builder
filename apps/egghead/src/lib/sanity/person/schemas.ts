import * as z from 'zod'

import { ImageSchema, SlugSchema, SystemFieldsSchema } from '../utils/schemas'

export const SanityPersonSchema = z.object({
	...SystemFieldsSchema.shape,
	name: z.string().optional(),
	slug: SlugSchema.optional(),
	image: ImageSchema.optional(),
	twitter: z.string().optional(),
	website: z.string().optional(),
})

export type SanityPerson = z.infer<typeof SanityPersonSchema>
