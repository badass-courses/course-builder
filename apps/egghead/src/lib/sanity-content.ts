import { z } from 'zod'

export const sanitySoftwareLibraryDocumentSchema = z.object({
	_type: z.literal('software-library'),
	_id: z.string(),
	slug: z.object({
		current: z.string(),
	}),
})

export type SanitySoftwareLibraryDocument = z.infer<
	typeof sanitySoftwareLibraryDocumentSchema
>

export const sanityVersionedSoftwareLibraryObjectSchema = z.object({
	_type: z.literal('versioned-software-library'),
	_key: z.string(),
	library: z.object({
		_type: z.literal('reference'),
		_ref: z.string(),
	}),
})

export type SanityVersionedSoftwareLibraryObject = z.infer<
	typeof sanityVersionedSoftwareLibraryObjectSchema
>

export const sanityCollaboratorDocumentSchema = z.object({
	_type: z.literal('collaborator'),
	role: z.enum(['instructor', 'staff', 'illustrator']),
	_id: z.string(),
	eggheadInstructorId: z.string(),
})

export type SanityCollaboratorDocument = z.infer<
	typeof sanityCollaboratorDocumentSchema
>

export const sanityReferenceSchema = z.object({
	_type: z.literal('reference'),
	_key: z.string(),
	_ref: z.string(),
})

export type SanityReference = z.infer<typeof sanityReferenceSchema>

export function createSanityReference(documentId: string): SanityReference {
	return {
		_type: 'reference',
		_key: keyGenerator(),
		_ref: documentId,
	}
}

export const sanityVideoResourceDocumentSchema = z.object({
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

export type SanityVideoResourceDocument = z.infer<
	typeof sanityVideoResourceDocumentSchema
>

export const sanityLessonDocumentSchema = z.object({
	_type: z.literal('lesson'),
	_id: z.string().nullish(),
	title: z.string(),
	slug: z.object({
		_type: z.literal('slug'),
		current: z.string(),
	}),
	description: z.string().nullish(),
	railsLessonId: z.string().or(z.number()).nullish(),
	softwareLibraries: z
		.array(sanityVersionedSoftwareLibraryObjectSchema)
		.nullish(),
	collaborators: z.array(sanityReferenceSchema).nullish(),
	status: z.string().nullish(),
	accessLevel: z.enum(['free', 'pro']).nullish(),
})

export type SanityLessonDocument = z.infer<typeof sanityLessonDocumentSchema>

export const keyGenerator = () => {
	return [...Array(12)]
		.map(() => Math.floor(Math.random() * 16).toString(16))
		.join('')
}
