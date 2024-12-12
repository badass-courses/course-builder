import * as z from 'zod'

import { ImageSchema, SlugSchema, SystemFieldsSchema } from '../utils/schemas'

export const SanitySoftwareLibrarySchema = z.object({
	...SystemFieldsSchema.shape,
	name: z.string().optional(),
	slug: SlugSchema.optional(),
	description: z.string().optional(),
	url: z.string().optional(),
	image: ImageSchema.optional(),
	path: z.string().optional(),
})

export type SanitySoftwareLibrary = z.infer<typeof SanitySoftwareLibrarySchema>
