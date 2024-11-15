import type { EggheadLesson } from '@/lib/egghead'
import {
	keyGenerator,
	sanityCollaboratorDocumentSchema,
	sanityLessonDocumentSchema,
	sanitySoftwareLibraryDocumentSchema,
	sanityVersionedSoftwareLibraryObjectSchema,
} from '@/lib/sanity-content'
import type {
	SanityCollaboratorDocument,
	SanityCollaboratorReferenceObject,
	SanitySoftwareLibraryDocument,
	SanityVersionedSoftwareLibraryObject,
} from '@/lib/sanity-content'
import { sanityWriteClient } from '@/server/sanity-write-client'

export async function postSanityLesson(
	eggheadLesson: EggheadLesson,
	collaborator: SanityCollaboratorReferenceObject,
	softwareLibraries: SanityVersionedSoftwareLibraryObject[],
) {
	const lesson = sanityLessonDocumentSchema.parse({
		_type: 'lesson',
		title: eggheadLesson.title,
		slug: {
			_type: 'slug',
			current: eggheadLesson.slug,
		},
		description: eggheadLesson.summary,
		railsLessonId: eggheadLesson.id,
		status: eggheadLesson.state,
		accessLevel: eggheadLesson.free_forever ? 'free' : 'pro',
		collaborators: [collaborator],
		softwareLibraries,
	})

	const sanityLesson = await sanityWriteClient.create(lesson)

	return sanityLesson
}

export async function getSanityCollaborator(
	instructorId: number,
	role: SanityCollaboratorDocument['role'] = 'instructor',
) {
	const collaboratorData = await sanityWriteClient.fetch(
		`*[_type == "collaborator" && eggheadInstructorId == "${instructorId}" && role == "${role}"][0]`,
	)

	const collaborator = sanityCollaboratorDocumentSchema.parse(collaboratorData)

	if (!collaborator) {
		return null
	}

	return {
		_key: keyGenerator(),
		_type: 'reference',
		_ref: collaborator._id,
	}
}

export async function getSanitySoftwareLibrary(
	librarySlug: SanitySoftwareLibraryDocument['slug']['current'],
) {
	const libraryData = await sanityWriteClient.fetch(
		`*[_type == "software-library" && slug.current == "${librarySlug}"][0]`,
	)

	const library = sanitySoftwareLibraryDocumentSchema.parse(libraryData)

	if (!library) {
		return null
	}

	return {
		_key: keyGenerator(),
		_type: 'versioned-software-library',
		library: {
			_type: 'reference',
			_ref: library._id,
		},
	}
}
