'use server'

import { db } from '@/db'
import { contentResource } from '@/db/schema'
import { getPost } from '@/lib/posts-query'
import { getServerAuthSession } from '@/server/auth'
import { sanityWriteClient } from '@/server/sanity-write-client'
import { eq } from 'drizzle-orm'

import { getSanityCollaborator } from './collaborator'
import { getSanityLessonForEggheadLessonId } from './lesson'
import { writeTagsToSanityResource } from './resource'
import { getSanitySoftwareLibrary } from './softwarelibrary'
import type {
	PositionInputItem,
	SanityArrayElementReference,
	SanityCourse,
} from './types'
import { createSanityArrayElementReference } from './utils'

/**
 * Creates a Sanity course document
 * @param course - The course data to create
 * @returns The created Sanity course document
 */
export const createSanityCourse = async (course: Partial<SanityCourse>) => {
	return await sanityWriteClient.create({
		_type: 'course',
		...course,
	})
}

/**
 * Gets a Sanity course document for an Egghead course ID
 * @param eggheadCourseId - The ID of the Egghead course
 * @returns The Sanity course document, or null if not found
 */
export async function getSanityCourseForEggheadCourseId(
	eggheadCourseId: number | null | undefined,
) {
	if (!eggheadCourseId) return null

	return await sanityWriteClient.fetch(
		`*[_type == "course" && railsCourseId == $eggheadCourseId][0]`,
		{ eggheadCourseId },
	)
}

/**
 * Adds a lesson to a Sanity course
 * @param eggheadLessonId - The ID of the Egghead lesson
 * @param eggheadPlaylistId - The ID of the Egghead playlist (course)
 * @returns The updated Sanity course document
 */
export async function addLessonToSanityCourse({
	eggheadLessonId,
	eggheadPlaylistId,
}: {
	eggheadLessonId: number
	eggheadPlaylistId: number
}) {
	const sanityLesson = await getSanityLessonForEggheadLessonId(eggheadLessonId)

	if (!sanityLesson || !sanityLesson._id) {
		throw new Error(`Sanity lesson with id ${eggheadLessonId} not found.`)
	}

	const sanityCourse =
		await getSanityCourseForEggheadCourseId(eggheadPlaylistId)

	if (!sanityCourse || !sanityCourse._id) {
		throw new Error(`Sanity course with id ${eggheadPlaylistId} not found.`)
	}

	const resources = sanityCourse.resources || []

	return await sanityWriteClient
		.patch(sanityCourse._id)
		.set({
			resources: [
				...resources,
				createSanityArrayElementReference(sanityLesson._id),
			],
		})
		.commit()
}

/**
 * Removes a lesson from a Sanity course
 * @param eggheadLessonId - The ID of the Egghead lesson
 * @param eggheadPlaylistId - The ID of the Egghead playlist (course)
 * @returns The updated Sanity course document
 */
export async function removeLessonFromSanityCourse({
	eggheadLessonId,
	eggheadPlaylistId,
}: {
	eggheadLessonId: number
	eggheadPlaylistId: number
}) {
	const sanityLesson = await getSanityLessonForEggheadLessonId(eggheadLessonId)

	if (!sanityLesson || !sanityLesson._id) {
		throw new Error(`Sanity lesson with id ${eggheadLessonId} not found.`)
	}

	const sanityCourse =
		await getSanityCourseForEggheadCourseId(eggheadPlaylistId)

	if (!sanityCourse || !sanityCourse._id) {
		throw new Error(`Sanity course with id ${eggheadPlaylistId} not found.`)
	}

	const resources = sanityCourse.resources || []

	const filteredResources = resources.filter(
		(resource: SanityArrayElementReference) =>
			resource._ref !== sanityLesson._id,
	)

	return await sanityWriteClient
		.patch(sanityCourse._id)
		.set({
			resources: filteredResources,
		})
		.commit()
}

/**
 * Reorders resources in a Sanity course
 * @param parentResourceId - The ID of the parent resource (course)
 * @param resources - The resources to reorder
 * @returns The updated Sanity course document
 */
export async function reorderResourcesInSanityCourse({
	parentResourceId,
	resources,
}: {
	parentResourceId: string
	resources: PositionInputItem[]
}) {
	const currentParentResourcePost = await getPost(parentResourceId)
	const eggheadPlaylistId = currentParentResourcePost?.fields?.eggheadPlaylistId

	if (!eggheadPlaylistId) {
		throw new Error(
			`Egghead playlist id not found for resource ${parentResourceId}.`,
		)
	}

	const sanityCourse =
		await getSanityCourseForEggheadCourseId(eggheadPlaylistId)

	if (!sanityCourse || !sanityCourse._id) {
		throw new Error(`Sanity course with id ${eggheadPlaylistId} not found.`)
	}

	const eggheadLessonIds = await Promise.all(
		resources.map(async (item) => {
			const resource = await db.query.contentResource.findFirst({
				where: eq(contentResource.id, item.resourceId),
			})
			return resource?.fields?.eggheadLessonId
		}),
	)

	const sanityLessons = await Promise.all(
		eggheadLessonIds.map(async (lessonId) => {
			return await getSanityLessonForEggheadLessonId(lessonId)
		}),
	)

	const newSanityLessonReferences = sanityLessons.map((lesson) => {
		return createSanityArrayElementReference(lesson?._id || '')
	})

	return await sanityWriteClient
		.patch(sanityCourse?._id)
		.set({
			resources: newSanityLessonReferences,
		})
		.commit()
}

/**
 * Updates metadata for a Sanity course
 * @param eggheadPlaylistId - The ID of the Egghead playlist (course)
 * @param title - The title of the course
 * @param slug - The slug of the course
 * @param sharedId - The shared ID of the course
 * @param description - The description of the course
 * @param productionProcessState - The production process state of the course
 * @param accessLevel - The access level of the course
 * @param searchIndexingState - The search indexing state of the course
 * @param image - The image of the course
 * @returns The updated Sanity course document
 */
export async function updateSanityCourseMetadata({
	eggheadPlaylistId,
	title,
	slug,
	sharedId,
	description,
	productionProcessState,
	accessLevel,
	searchIndexingState,
	image,
}: {
	eggheadPlaylistId: number
	title: string
	slug: string
	sharedId: string
	description: string
	productionProcessState: string
	accessLevel: string
	searchIndexingState: string
	image: string
}) {
	const sanityCourse =
		await getSanityCourseForEggheadCourseId(eggheadPlaylistId)

	if (!sanityCourse || !sanityCourse._id) {
		throw new Error(`Sanity course with id ${eggheadPlaylistId} not found.`)
	}

	return await sanityWriteClient
		.patch(sanityCourse?._id)
		.set({
			title,
			slug: {
				current: slug,
			},
			sharedId,
			description,
			productionProcessState:
				productionProcessState === 'published' ? 'published' : 'drafting',
			accessLevel,
			searchIndexingState:
				searchIndexingState === 'public' ? 'indexed' : 'hidden',
			image,
		})
		.commit()
}
