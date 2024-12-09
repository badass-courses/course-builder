import * as z from 'zod'

import {
	ImageSchema,
	ReferenceSchema,
	SlugSchema,
	SystemFieldsSchema,
} from '../utils/schemas'

export const SoftwareLibrarySchema = z.object({
	_type: z.string().optional(),
	_key: z.string().optional(),
	library: ReferenceSchema.optional(),
})
export type SoftwareLibrary = z.infer<typeof SoftwareLibrarySchema>

export const SanityCourseSchema = z.object({
	...SystemFieldsSchema.shape,
	title: z.string().optional(),
	slug: SlugSchema.optional(),
	summary: z.string().optional(),
	description: z.string().optional(),
	image: z.string().optional(),
	images: z.array(ImageSchema).optional(),
	imageIllustrator: ReferenceSchema.optional(),
	accessLevel: z.string().optional(),
	searchIndexingState: z.string().optional(),
	productionProcessState: z.string().optional(),
	railsCourseId: z.number().optional(),
	sharedId: z.string().optional(),
	softwareLibraries: z.array(SoftwareLibrarySchema).optional(),
	collaborators: z.array(ReferenceSchema).optional(),
	resources: z.array(ReferenceSchema).optional(),
})

export type SanityCourse = z.infer<typeof SanityCourseSchema>
