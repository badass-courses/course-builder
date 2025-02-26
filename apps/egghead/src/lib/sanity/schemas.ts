import { z } from 'zod'

/**
 * Common Sanity schemas
 */

/**
 * Image schema for Sanity
 */
export const ImageSchema = z.object({
	_type: z.string().optional(),
	label: z.string().optional(),
	url: z.string().optional(),
	_key: z.string().optional(),
})

/**
 * Slug schema for Sanity
 */
export const SlugSchema = z.object({
	current: z.string().optional(),
	_type: z.string().optional(),
})

/**
 * Common system fields for Sanity documents
 */
export const SystemFieldsSchema = z.object({
	_id: z.string().optional(),
	_type: z.string().optional(),
	_rev: z.string().optional(),
	_createdAt: z.coerce.date().optional(),
	_updatedAt: z.coerce.date().optional(),
})

/**
 * Reference schema for Sanity
 */
export const ReferenceSchema = z.object({
	_ref: z.string().optional(),
	_type: z.string().optional(),
	_key: z.string().optional(),
})

/**
 * Software library document schema for Sanity
 */
export const sanitySoftwareLibraryDocumentSchema = z.object({
	_type: z.literal('software-library'),
	_id: z.string(),
	slug: z.object({
		current: z.string(),
	}),
})

/**
 * Reference schema for Sanity
 */
export const SanityReferenceSchema = z.object({
	_type: z.literal('reference'),
	_key: z.string(),
	_ref: z.string(),
})

/**
 * Software library array object schema for Sanity
 */
export const SoftwareLibraryArrayObjectSchema = z.object({
	_type: z.string().optional(),
	_key: z.string().optional(),
	library: ReferenceSchema.optional(),
})

/**
 * Video resource document schema for Sanity
 */
export const SanityVideoResourceDocumentSchema = z.object({
	_createdAt: z.string().datetime().nullish(),
	_id: z.string().nullish(),
	_rev: z.string().nullish(),
	_type: z.literal('videoResource'),
	_updatedAt: z.string().datetime().nullish(),
	filename: z.string().nullish(),
	mediaUrls: z.object({
		hlsUrl: z.string(),
		dashUrl: z.string().nullish(),
	}),
	muxAsset: z
		.object({
			muxAssetId: z.string().nullish(),
			muxPlaybackId: z.string().nullish(),
		})
		.nullish(),
	transcript: z
		.object({
			srt: z.string().nullish(),
			text: z.string().nullish(),
		})
		.nullish(),
})

/**
 * Lesson document schema for Sanity
 */
export const SanityLessonDocumentSchema = z.object({
	_type: z.literal('lesson'),
	_id: z.string().nullish(),
	title: z.string(),
	slug: z.object({
		_type: z.literal('slug'),
		current: z.string(),
	}),
	description: z.string().nullish(),
	railsLessonId: z.string().or(z.number()).nullish(),
	softwareLibraries: z.array(SoftwareLibraryArrayObjectSchema).nullish(),
	collaborators: z.array(SanityReferenceSchema).nullish(),
	status: z.string().nullish(),
	accessLevel: z.enum(['free', 'pro']).nullish(),
})

/**
 * Collaborator schema for Sanity
 */
export const SanityCollaboratorSchema = z.object({
	...SystemFieldsSchema.shape,
	person: ReferenceSchema.optional(),
	title: z.string().optional(),
	eggheadInstructorId: z.string().optional(),
	role: z.string().optional(),
	department: z.string().optional(),
})

/**
 * Course schema for Sanity
 */
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
	softwareLibraries: z.array(SoftwareLibraryArrayObjectSchema).optional(),
	collaborators: z
		.array(ReferenceSchema)
		.optional()
		.or(SanityCollaboratorSchema)
		.optional(),
	resources: z.array(ReferenceSchema).optional(),
})
