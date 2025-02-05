'use server'

import { courseBuilderAdapter, db } from '@/db'
import {
	contentResource,
	contentResourceResource,
	contentResourceTag,
	users,
} from '@/db/schema'
import {
	getEggheadLesson,
	getEggheadUserProfile,
	type EggheadLesson,
} from '@/lib/egghead'
import {
	createSanityReference,
	keyGenerator,
	SanityCollaboratorSchema,
	SanityCourseSchema,
	SanityLessonDocumentSchema,
	SanityReferenceSchema,
	sanitySoftwareLibraryDocumentSchema,
	SanityVideoResourceDocumentSchema,
	SoftwareLibraryArrayObjectSchema,
} from '@/lib/sanity-content'
import type {
	SanityCollaborator,
	SanityCourse,
	SanityReference,
	SanitySoftwareLibraryDocument,
	SoftwareLibraryArrayObject,
} from '@/lib/sanity-content'
import { sanityWriteClient } from '@/server/sanity-write-client'
import { asc, eq, sql } from 'drizzle-orm'

import type { VideoResource } from '@coursebuilder/core/schemas'

import { syncInstructorToSanity } from './instructor-query'
import { Post, PostSchema } from './posts'

export async function createSanityVideoResource(videoResource: VideoResource) {
	const { muxPlaybackId, muxAssetId, transcript, srt, id } = videoResource

	const streamUrl =
		muxPlaybackId && `https://stream.mux.com/${muxPlaybackId}.m3u8`

	const body = SanityVideoResourceDocumentSchema.parse({
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
	post,
	eggheadLessonId,
	videoResourceId,
}: {
	post: Post
	eggheadLessonId: number | null | undefined
	videoResourceId: string | null | undefined
}) {
	if (!eggheadLessonId || !videoResourceId) return

	const videoResource =
		await courseBuilderAdapter.getVideoResource(videoResourceId)

	if (!videoResource) {
		throw new Error(`Video resource with id ${videoResourceId} not found.`)
	}

	let sanityLessonDocument =
		await getSanityLessonForEggheadLessonId(eggheadLessonId)

	if (!sanityLessonDocument) {
		const eggheadLesson = await getEggheadLesson(eggheadLessonId)

		if (!eggheadLesson) {
			throw new Error(`Egghead lesson with id ${eggheadLessonId} not found.`)
		}

		let collaboratorReference = (await getSanityCollaborator(
			eggheadLesson.instructor.id,
			'instructor',
			true,
		)) as SanityReference

		if (!collaboratorReference) {
			const user = await db.query.users.findFirst({
				where: eq(users.id, post.createdById),
				with: {
					accounts: true,
				},
			})

			const eggheadAccountId = user?.accounts?.find(
				(account) => account.provider === 'egghead',
			)?.providerAccountId

			if (!eggheadAccountId) {
				throw new Error(
					`Egghead account id not found for user ${post.createdById}.`,
				)
			}

			// [next]  ⨯ apps/egghead/src/lib/egghead.ts (27:9) @ getEggheadUserProfile
			// [next]  ⨯ Error: no-user
			// [next]     at getEggheadUserProfile (./apps/egghead/src/lib/egghead.ts:27:9)
			// [next]     at async replaceSanityLessonResources (./apps/egghead/src/lib/sanity-content-query.ts:116:31)
			// [next]     at async writePostUpdateToDatabase (./apps/egghead/src/lib/posts-query.ts:559:2)

			const eggheadUserProfile = await getEggheadUserProfile(user.id)

			if (!eggheadUserProfile) {
				throw new Error(
					`Egghead user profile with id ${eggheadLesson.instructor.user_id} not found.`,
				)
			}

			await syncInstructorToSanity(eggheadUserProfile)

			collaboratorReference = (await getSanityCollaborator(
				eggheadLesson.instructor.id,
				'instructor',
				true,
			)) as SanityReference

			if (!collaboratorReference) {
				throw new Error(
					`Sanity collaborator with egghead instructor id ${eggheadLesson.instructor.id} not found.`,
				)
			}
		}

		// create sanity lesson

		await createSanityLesson(eggheadLesson, collaboratorReference, [])
		sanityLessonDocument =
			await getSanityLessonForEggheadLessonId(eggheadLessonId)
	}

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

// updateSanityCourse

export async function updateSanityLesson(
	eggheadLessonId: number | null | undefined,
	lesson?: Post | null,
) {
	if (!eggheadLessonId || !lesson) return

	const sanityLessonDocument =
		await getSanityLessonForEggheadLessonId(eggheadLessonId)
	const eggheadLesson = await getEggheadLesson(eggheadLessonId)

	if (!sanityLessonDocument || !eggheadLesson) return

	// TODO: write sanity libraries and collaborator when not existing

	const softwareLibraries = await Promise.all(
		eggheadLesson.topic_list.map(async (library: string) => {
			console.log('process topic library', library)
			return SoftwareLibraryArrayObjectSchema.nullable().parse(
				await getSanitySoftwareLibrary(library),
			)
		}),
	)

	const collaboratorData = await getSanityCollaborator(
		eggheadLesson.instructor.id,
	)

	let collaborator = SanityReferenceSchema.nullable().parse(collaboratorData)

	if (!collaborator) {
		const user = await db.query.users.findFirst({
			where: eq(users.id, lesson.createdById),
			with: {
				accounts: true,
			},
		})

		const eggheadAccountId = user?.accounts?.find(
			(account) => account.provider === 'egghead',
		)?.providerAccountId

		if (!eggheadAccountId) {
			throw new Error(
				`Egghead account id not found for user ${lesson.createdById}.`,
			)
		}

		const eggheadUserProfile = await getEggheadUserProfile(eggheadAccountId)

		if (!eggheadUserProfile) {
			throw new Error(
				`Egghead user profile with id ${eggheadLesson.instructor.user_id} not found.`,
			)
		}

		await syncInstructorToSanity(eggheadUserProfile)

		collaborator = SanityReferenceSchema.nullable().parse(
			await getSanityCollaborator(eggheadLesson.instructor.id),
		)

		if (!collaborator) {
			throw new Error(
				`Sanity collaborator with egghead instructor id ${eggheadLesson.instructor.id} not found.`,
			)
		}
	}

	return await sanityWriteClient
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
	collaborator: SanityReference,
	softwareLibraries: SoftwareLibraryArrayObject[],
) {
	const post = PostSchema.nullable().parse(
		await db.query.contentResource.findFirst({
			where: eq(
				sql`JSON_EXTRACT (${contentResource.fields}, "$.eggheadLessonId")`,
				eggheadLesson.id,
			),
			with: {
				tags: {
					with: {
						tag: true,
					},
					orderBy: asc(contentResourceTag.position),
				},
				resources: {
					with: {
						resource: true,
					},
					orderBy: asc(contentResourceResource.position),
				},
			},
		}),
	)

	if (!post) {
		throw new Error(`Post with id ${eggheadLesson.id} not found.`)
	}

	const existingSanityLessonDocument = await getSanityLessonForEggheadLessonId(
		eggheadLesson.id,
	)

	if (existingSanityLessonDocument) {
		return updateSanityLesson(eggheadLesson.id, post)
	}

	const lesson = SanityLessonDocumentSchema.parse({
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
	role: SanityCollaborator['role'] = 'instructor',
	returnReference = true,
) {
	const collaboratorData = await sanityWriteClient.fetch(
		`*[_type == "collaborator" && eggheadInstructorId == "${instructorId}" && role == "${role}"][0]`,
	)

	const collaborator =
		SanityCollaboratorSchema.nullable().parse(collaboratorData)

	if (!collaborator || !collaborator._id) return null

	return returnReference
		? createSanityReference(collaborator._id)
		: collaborator
}

export async function getSanitySoftwareLibrary(
	librarySlug: SanitySoftwareLibraryDocument['slug']['current'],
) {
	const libraryData = await sanityWriteClient.fetch(
		`*[_type == "software-library" && slug.current == "${librarySlug}"][0]`,
	)

	const library = sanitySoftwareLibraryDocumentSchema
		.nullable()
		.parse(libraryData)

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

export const createSanityCourse = async (course: Partial<SanityCourse>) => {
	return await sanityWriteClient.create({
		_type: 'course',
		...course,
	})
}
export async function getSanityCourseForEggheadCourseId(
	eggheadCourseId: number,
) {
	const sanityCourse = await sanityWriteClient.fetch(
		`*[_type == "course" && railsCourseId == ${eggheadCourseId}][0]`,
	)

	return SanityCourseSchema.nullable().parse(sanityCourse)
}

export async function addLessonToSanityCourse({
	eggheadLessonId,
	eggheadPlaylistId,
}: {
	eggheadLessonId: number
	eggheadPlaylistId: number
}) {
	const sanityCourse =
		await getSanityCourseForEggheadCourseId(eggheadPlaylistId)

	if (!sanityCourse || !sanityCourse._id) {
		throw new Error(`Sanity course with id ${eggheadPlaylistId} not found.`)
	}

	const sanityLesson = await getSanityLessonForEggheadLessonId(eggheadLessonId)

	if (!sanityLesson) {
		throw new Error(`Sanity lesson with id ${eggheadLessonId} not found.`)
	}

	const sanityLessonReference = createSanityReference(sanityLesson._id)

	return await sanityWriteClient
		.patch(sanityCourse?._id)
		.set({
			resources: [...(sanityCourse.resources || []), sanityLessonReference],
		})
		.commit()
}

export async function removeLessonFromSanityCourse({
	eggheadLessonId,
	eggheadPlaylistId,
}: {
	eggheadLessonId: number
	eggheadPlaylistId: number
}) {
	const sanityCourse =
		await getSanityCourseForEggheadCourseId(eggheadPlaylistId)

	if (!sanityCourse || !sanityCourse._id) {
		throw new Error(`Sanity course with id ${eggheadPlaylistId} not found.`)
	}

	const sanityLesson = await getSanityLessonForEggheadLessonId(eggheadLessonId)

	if (!sanityLesson) {
		throw new Error(`Sanity lesson with id ${eggheadLessonId} not found.`)
	}
	const resources = sanityCourse.resources || []
	const filteredResources = resources.filter(
		(resource) => resource._ref !== sanityLesson._id,
	)

	return await sanityWriteClient
		.patch(sanityCourse?._id)
		.set({
			resources: filteredResources,
		})
		.commit()
}
