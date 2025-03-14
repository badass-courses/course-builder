'use server'

import { getPost } from '@/lib/posts-query'
import { getServerAuthSession } from '@/server/auth'
import { sanityWriteClient } from '@/server/sanity-write-client'

import { getSanityCollaborator } from './collaborator'
import { getSanityCourseForEggheadCourseId } from './course'
import { getSanityLessonForEggheadLessonId } from './lesson'
import { getSanitySoftwareLibrary } from './softwarelibrary'
import { createSanityArrayElementReference, keyGenerator } from './utils'

/**
 * Gets the appropriate Sanity resource (lesson or course) for a post
 * @param post - The post to get the Sanity resource for
 * @returns The Sanity resource document, or null if not found
 */
export async function getSanityResourceForPost(post: any) {
	const postType = post.fields.postType

	if (postType === 'lesson') {
		return await getSanityLessonForEggheadLessonId(post.fields.eggheadLessonId)
	}

	if (postType === 'course') {
		return await getSanityCourseForEggheadCourseId(
			post.fields.eggheadPlaylistId,
		)
	}

	return null
}

/**
 * Converts post tags to Sanity software library references
 * @param tags - The tags to convert
 * @returns An array of Sanity software library references
 */
export async function getSoftwareLibraryReferencesFromTags(tags: any[]) {
	if (!tags.length) return []

	const softwareLibraries = await Promise.all(
		tags.map(async ({ tag }) => {
			return await getSanitySoftwareLibrary(tag.fields.slug)
		}),
	)

	return softwareLibraries
		.filter((library): library is NonNullable<typeof library> =>
			Boolean(library?._id),
		) // Filter out null or undefined libraries
		.map((library) => createSanityArrayElementReference(library._id))
}

/**
 * Creates versioned software library objects from tags
 * @param tags - Array of tags
 * @returns Array of versioned software library objects
 */
export async function createVersionedSoftwareLibraries(tags: any[]) {
	if (!tags.length) return []

	const softwareLibraries = await Promise.all(
		tags.map(async ({ tag }) => {
			return await getSanitySoftwareLibrary(tag.fields.slug)
		}),
	)

	return softwareLibraries
		.filter((library): library is NonNullable<typeof library> =>
			Boolean(library?._id),
		) // Filter out null or undefined libraries
		.map((library) => ({
			_type: 'versioned-software-library',
			_key: keyGenerator(),
			library: {
				_type: 'reference',
				_ref: library._id,
			},
		}))
}

/**
 * Writes tags from a post to its corresponding Sanity resource (lesson or course)
 * @param postId - The ID of the post containing the tags
 * @returns The updated Sanity resource document
 */
export async function writeTagsToSanityResource(postId: string) {
	const post = await getPost(postId)

	if (!post) {
		throw new Error(`Post with id ${postId} not found.`)
	}

	// Get the appropriate Sanity resource based on post type
	const sanityResource = await getSanityResourceForPost(post)

	if (!sanityResource) {
		throw new Error(`Sanity resource for post with id ${postId} not found.`)
	}

	// Create versioned software libraries
	const softwareLibraries = await createVersionedSoftwareLibraries(
		post.tags || [],
	)

	// Update the Sanity resource with only the new structure
	return await sanityWriteClient
		.patch(sanityResource._id)
		.set({
			softwareLibraries,
		})
		.unset(['softwareLibraryArrayReferences']) // Remove the old property if it exists
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
