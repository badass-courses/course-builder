'use server'

import { courseBuilderAdapter, db } from '@/db'
import { contentResource } from '@/db/schema'
import { getEggheadLesson, type EggheadLesson } from '@/lib/egghead'
import {
	keyGenerator,
	sanityCollaboratorDocumentSchema,
	sanityCollaboratorReferenceObjectSchema,
	sanityLessonDocumentSchema,
	sanitySoftwareLibraryDocumentSchema,
	sanityVersionedSoftwareLibraryObjectSchema,
	sanityVideoResourceDocumentSchema,
} from '@/lib/sanity-content'
import type {
	SanityCollaboratorDocument,
	SanityCollaboratorReferenceObject,
	SanitySoftwareLibraryDocument,
	SanityVersionedSoftwareLibraryObject,
} from '@/lib/sanity-content'
import { sanityWriteClient } from '@/server/sanity-write-client'
import { eq, sql } from 'drizzle-orm'

import type { VideoResource } from '@coursebuilder/core/schemas'

import { Post } from './posts'

export async function createSanityVideoResource(videoResource: VideoResource) {
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

export async function replaceSanityLessonResources({
	eggheadLessonId,
	videoResourceId,
}: {
	eggheadLessonId: number | null | undefined
	videoResourceId: string | null | undefined
}) {
	if (!eggheadLessonId || !videoResourceId) return

	const videoResource =
		await courseBuilderAdapter.getVideoResource(videoResourceId)

	if (!videoResource) {
		throw new Error(`Video resource with id ${videoResourceId} not found.`)
	}

	const sanityLessonDocument =
		await getSanityLessonForEggheadLessonId(eggheadLessonId)

	const sanityVideoResourceDocument =
		await createSanityVideoResource(videoResource)

	return await sanityWriteClient
		.patch(sanityLessonDocument._id)
		.set({
			resources: [
				{
					_key: keyGenerator(),
					_type: 'reference',
					_ref: sanityVideoResourceDocument._id,
				},
			],
		})
		.commit()
}

export async function patchSanityLessonWithVideoResourceReference(
	eggheadLessonId: number | null | undefined,
	videoResourceDocumentId: string,
) {
	if (!eggheadLessonId) return
	const sanityLessonDocument =
		await getSanityLessonForEggheadLessonId(eggheadLessonId)

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

export async function getSanityLessonForEggheadLessonId(
	eggheadLessonId: number | null | undefined,
) {
	if (!eggheadLessonId) return

	return sanityWriteClient.fetch(
		`*[_type == "lesson" && railsLessonId == ${eggheadLessonId}][0]`,
	)
}

export async function updateSanityLesson(
	eggheadLessonId: number | null | undefined,
	lesson?: Post | null,
) {
	if (!eggheadLessonId || !lesson) return

	const sanityLessonDocument =
		await getSanityLessonForEggheadLessonId(eggheadLessonId)
	const eggheadLesson = await getEggheadLesson(eggheadLessonId)

	if (!sanityLessonDocument || !eggheadLesson) return

	const softwareLibraries = await Promise.all(
		eggheadLesson.topic_list.map(async (library: string) => {
			return sanityVersionedSoftwareLibraryObjectSchema.parse(
				await getSanitySoftwareLibrary(library),
			)
		}),
	)

	const collaborator = sanityCollaboratorReferenceObjectSchema.parse(
		await getSanityCollaborator(eggheadLesson.instructor.id),
	)

	await sanityWriteClient
		.patch(sanityLessonDocument._id)
		.set({
			description: lesson.fields.body,
			status: eggheadLesson.state,
			accessLevel: eggheadLesson.is_pro
				? 'pro'
				: eggheadLesson.free_forever
					? 'free'
					: 'pro',
			title: lesson.fields.title,
			slug: {
				_type: 'slug',
				current: lesson.fields.slug,
			},
			collaborators: [collaborator],
			softwareLibraries,
		})
		.commit()
}

export async function createSanityLesson(
	eggheadLesson: EggheadLesson,
	collaborator: SanityCollaboratorReferenceObject,
	softwareLibraries: SanityVersionedSoftwareLibraryObject[],
) {
	const post = await db.query.contentResource.findFirst({
		where: eq(
			sql`JSON_EXTRACT (${contentResource.fields}, "$.eggheadLessonId")`,
			eggheadLesson.id,
		),
	})

	if (!post) {
		throw new Error(`Post with id ${eggheadLesson.id} not found.`)
	}

	const lesson = sanityLessonDocumentSchema.parse({
		_id: `lesson-${eggheadLesson.id}`,
		_type: 'lesson',
		title: eggheadLesson.title,
		slug: {
			_type: 'slug',
			current: eggheadLesson.slug,
		},
		description: post?.fields?.body,
		railsLessonId: eggheadLesson.id,
		status: eggheadLesson.state,
		accessLevel: eggheadLesson.is_pro
			? 'pro'
			: eggheadLesson.free_forever
				? 'free'
				: 'pro',
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
