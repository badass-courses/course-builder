'use server'

import { getPost } from '@/lib/posts-query'
import { getServerAuthSession } from '@/server/auth'
import { sanityWriteClient } from '@/server/sanity-write-client'

import { getEggheadUserProfile } from '../egghead/auth'
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
	// Events don't have Sanity resources
	if (post.type === 'event') {
		return null
	}

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

	// Events don't have Sanity resources and don't need to be synced to Sanity
	if (post.type === 'event') {
		console.log(`Skipping Sanity sync for event ${postId} - no Sanity resource`)
		return
	}

	// Get the appropriate Sanity resource based on post type
	const sanityResource = await getSanityResourceForPost(post)

	if (!sanityResource) {
		// For posts that don't have Sanity resources, skip the sync instead of throwing an error
		console.log(
			`Skipping Sanity sync for ${post.type} ${postId} - no Sanity resource found`,
		)
		return
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

	const eggheadUser = await getEggheadUserProfile(userId)

	if (!eggheadUser || !eggheadUser.instructor?.id) {
		throw new Error(`egghead instructor for user ${userId} not found.`)
	}

	const sanityInstructorReference = await getSanityCollaborator(
		parseInt(eggheadUser.instructor.id.toString()),
	)

	if (!sanityInstructorReference) {
		throw new Error(`Sanity instructor with id ${userId} not found.`)
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
