'use server'

import { db } from '@/db'
import { contentResource } from '@/db/schema'
import { getPost } from '@/lib/posts-query'
import { getServerAuthSession } from '@/server/auth'
import { sanityWriteClient } from '@/server/sanity-write-client'
import { eq } from 'drizzle-orm'

import { getSanityCollaborator } from './collaborator'
import { getSanityLessonForEggheadLessonId } from './lesson'
import { getSanitySoftwareLibrary } from './softwarelibrary'
import type { PositionInputItem, Reference, SanityCourse } from './types'
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
		(resource: Reference) => resource._ref !== sanityLesson._id,
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

/**
 * Writes tags to a Sanity resource (lesson or course)
 * @param postId - The ID of the post
 * @returns The updated Sanity resource document
 */
export async function writeTagsToSanityResource(postId: string) {
	const post = await getPost(postId)

	if (!post) {
		throw new Error(`Post with id ${postId} not found.`)
	}

	let sanityResource
	if (post.fields.postType === 'lesson') {
		sanityResource = await getSanityLessonForEggheadLessonId(
			post.fields.eggheadLessonId,
		)
	} else if (post.fields.postType === 'course') {
		sanityResource = await getSanityCourseForEggheadCourseId(
			post.fields.eggheadPlaylistId,
		)
	}

	if (!sanityResource) {
		throw new Error(`Sanity resource for post with id ${postId} not found.`)
	}

	const softwareLibraries = post?.tags
		? await Promise.all(
				post?.tags?.map(async ({ tag }) => {
					return await getSanitySoftwareLibrary(tag.fields.slug)
				}),
			)
		: []

	return await sanityWriteClient
		.patch(sanityResource._id)
		.set({
			softwareLibraries,
		})
		.commit()
}

/**
 * Syncs a Sanity resource instructor
 * @param postId - The ID of the post
 * @param userId - The ID of the user
 * @returns The updated Sanity resource document
 */
export async function syncSanityResourceInstructor(
	postId: string,
	userId: string,
) {
	const { ability, session } = await getServerAuthSession()

	if (!session?.user?.id || ability.cannot('manage', 'all')) {
		throw new Error('Unauthorized')
	}

	const post = await getPost(postId)

	if (!post) {
		throw new Error(`Post with id ${postId} not found.`)
	}

	// Extract instructor ID using a more flexible approach
	let instructorId: string | number | null = null

	// Use a type guard to safely access properties
	const fields = post.fields as Record<string, any>

	if (
		fields.instructor &&
		typeof fields.instructor === 'object' &&
		'id' in fields.instructor
	) {
		instructorId = fields.instructor.id
	} else if ('instructorId' in fields) {
		instructorId = fields.instructorId
	}

	if (!instructorId) {
		throw new Error(`Instructor ID not found for post ${postId}.`)
	}

	const sanityInstructorReference = await getSanityCollaborator(
		parseInt(instructorId.toString()),
	)

	if (!sanityInstructorReference) {
		throw new Error(`Sanity instructor with id ${instructorId} not found.`)
	}

	switch (post.fields.postType) {
		case 'lesson':
			const sanityLesson = await getSanityLessonForEggheadLessonId(
				post.fields.eggheadLessonId,
			)

			if (!sanityLesson || !sanityLesson._id) {
				throw new Error(
					`Sanity lesson with id ${post.fields.eggheadLessonId} not found.`,
				)
			}

			return await sanityWriteClient
				.patch(sanityLesson?._id)
				.set({
					collaborators: [sanityInstructorReference],
				})
				.commit()

		case 'course':
			const sanityCourse = await getSanityCourseForEggheadCourseId(
				post.fields.eggheadPlaylistId,
			)

			if (!sanityCourse || !sanityCourse._id) {
				throw new Error(
					`Sanity course with id ${post.fields.eggheadPlaylistId} not found.`,
				)
			}

			return await sanityWriteClient
				.patch(sanityCourse?._id)
				.set({
					collaborators: [sanityInstructorReference],
				})
				.commit()
	}
}
