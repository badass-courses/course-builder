'use server'

import type { EggheadLesson } from '@/lib/egghead'
import {
	keyGenerator,
	sanityCollaboratorDocumentSchema,
	sanityLessonDocumentSchema,
	sanitySoftwareLibraryDocumentSchema,
	sanityVideoResourceDocumentSchema,
} from '@/lib/sanity-content'
import type {
	SanityCollaboratorDocument,
	SanityCollaboratorReferenceObject,
	SanitySoftwareLibraryDocument,
	SanityVersionedSoftwareLibraryObject,
} from '@/lib/sanity-content'
import { sanityWriteClient } from '@/server/sanity-write-client'

import type { VideoResource } from '@coursebuilder/core/schemas'

export async function postSanityVideoResource(videoResource: VideoResource) {
	const { muxPlaybackId, muxAssetId, transcript, srt, id } = videoResource

	const streamUrl =
		muxPlaybackId && `https://stream.mux.com/${muxPlaybackId}.m3u8`

	const body = sanityVideoResourceDocumentSchema.parse({
		_type: 'videoResource',
		filename: id,
		muxAsset: {
			muxAssetId,
			muxPlaybackId,
		},
		mediaUrls: {
			hlsUrl: streamUrl,
		},
		transcript: {
			srt,
			text: transcript,
		},
	})

	const sanityVideoResourceDocument = await sanityWriteClient.create(body)

	if (!sanityVideoResourceDocument) {
		throw new Error('Failed to create video resource in sanity')
	}

	return sanityVideoResourceDocument
}

export async function patchSanityLessonWithVideoResourceReference(
	eggheadLessonId: number,
	videoResourceDocumentId: string,
) {
	const sanityLessonDocument = await getSanityLesson(eggheadLessonId)

	if (!sanityLessonDocument) return

	return await sanityWriteClient
		.patch(sanityLessonDocument._id)
		.set({
			resources: [
				...(sanityLessonDocument?.resources || []),
				{
					_key: keyGenerator(),
					_type: 'reference',
					_ref: videoResourceDocumentId,
				},
			],
		})
		.commit()
}

export async function getSanityLesson(
	eggheadLessonId: number | null | undefined,
) {
	if (!eggheadLessonId) return

	return sanityWriteClient.fetch(
		`*[_type == "lesson" && railsLessonId == ${eggheadLessonId}][0]`,
	)
}

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
