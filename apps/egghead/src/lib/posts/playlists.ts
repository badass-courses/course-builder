import { revalidatePath, revalidateTag } from 'next/cache'
import { db } from '@/db'
import { eggheadPgQuery } from '@/db/eggheadPostgres'
import { contentResource, contentResourceResource } from '@/db/schema'
import { EggheadApiError } from '@/errors/egghead-api-error'
import { getServerAuthSession } from '@/server/auth'
import { and, eq, like } from 'drizzle-orm'

import { ContentResource } from '@coursebuilder/core/schemas'
import { last } from '@coursebuilder/nodash'

import { reorderResourcesInSanityCourse } from '../sanity-content-query'
import { getPost } from './read'

// Simple CourseBuilderError implementation until properly imported
class CourseBuilderError extends Error {
	constructor(message: string) {
		super(message)
		this.name = 'CourseBuilderError'
	}
}

/**
 * Adds an Egghead lesson to a specified playlist
 *
 * @param eggheadPlaylistId - The ID of the playlist to add the lesson to
 * @param eggheadLessonId - The ID of the lesson to add
 * @param position - Optional position for the lesson in the playlist
 * @returns The response from the Egghead API
 * @throws {EggheadApiError} If the API returns an error
 * @throws {Error} If the user is not authorized
 */
export const addEggheadLessonToPlaylist = async ({
	eggheadPlaylistId,
	eggheadLessonId,
	position,
}: {
	eggheadPlaylistId: string
	eggheadLessonId: string
	position?: number
}) => {
	const { session, ability } = await getServerAuthSession()

	if (!session?.user?.id || !ability.can('create', 'Content')) {
		throw new Error('Unauthorized')
	}

	const response = await fetch(
		`${process.env.EGGHEAD_API_V1_BASE_URL}/api/v1/playlists/${eggheadPlaylistId}/lessons`,
		{
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${process.env.EGGHEAD_AUTH_TOKEN}`,
			},
			body: JSON.stringify({
				playlist_id: eggheadPlaylistId,
				lesson_id: eggheadLessonId,
				position,
			}),
		},
	).then(async (res) => {
		if (res.status === 422) {
			const body = await res.json()
			if (body?.error?.includes('Item already in the list')) {
				return {
					message: 'Item already in the list',
				}
			}
		}

		if (!res.ok) {
			throw new EggheadApiError(res.statusText, res.status)
		}

		return await res.json()
	})

	return response
}

/**
 * Removes a post from a course post
 *
 * @param postId - The ID of the post to remove
 * @param resourceOfId - The ID of the course post
 * @returns The result of the operation
 * @throws {CourseBuilderError} If the course post or post ID is missing
 */
export const removePostFromCoursePost = async ({
	postId,
	resourceOfId,
}: {
	postId: string
	resourceOfId: string
}) => {
	if (!postId || !resourceOfId) {
		throw new Error('Missing post ID or course post ID')
	}

	const result = await db
		.delete(contentResourceResource)
		.where(
			and(
				eq(contentResourceResource.resourceId, postId),
				eq(contentResourceResource.resourceOfId, resourceOfId),
			),
		)

	try {
		const post = await getPost(postId)
		const coursePost = await getPost(resourceOfId)

		if (
			coursePost?.fields?.postType === 'course' &&
			post?.fields?.postType === 'lesson' &&
			post?.fields?.eggheadLessonId &&
			coursePost?.fields?.eggheadPlaylistId
		) {
			await removeEggheadLessonFromPlaylist({
				eggheadLessonId: String(post.fields.eggheadLessonId),
				eggheadPlaylistId: String(coursePost.fields.eggheadPlaylistId),
			})
		}
	} catch (e) {
		console.error('Error syncing with Egghead', e)
	}

	revalidateTag('posts')
	return result
}

/**
 * Removes a lesson from an Egghead playlist
 *
 * @param eggheadLessonId - The ID of the lesson to remove
 * @param eggheadPlaylistId - The ID of the playlist
 * @returns The response from the Egghead API
 * @throws {EggheadApiError} If the API returns an error
 * @throws {Error} If the user is not authorized
 */
export const removeEggheadLessonFromPlaylist = async ({
	eggheadLessonId,
	eggheadPlaylistId,
}: {
	eggheadLessonId: string
	eggheadPlaylistId: string
}) => {
	const { session, ability } = await getServerAuthSession()

	if (!session?.user?.id || !ability.can('create', 'Content')) {
		throw new Error('Unauthorized')
	}

	const response = await fetch(
		`${process.env.EGGHEAD_API_V1_BASE_URL}/api/v1/playlists/${eggheadPlaylistId}/lessons/${eggheadLessonId}`,
		{
			method: 'DELETE',
			headers: {
				Authorization: `Bearer ${process.env.EGGHEAD_AUTH_TOKEN}`,
			},
		},
	).then(async (res) => {
		if (!res.ok) {
			console.log('Error removing lesson from playlist', res)
			throw new EggheadApiError(res.statusText, res.status)
		}
		return await res.json()
	})

	return response
}

/**
 * Adds a resource as a child to another resource
 *
 * @param resource - The resource to add
 * @param parentResourceId - The ID of the parent resource
 * @returns The newly created resource relationship
 * @throws {Error} If the parent workshop is not found
 */
export const addResourceToResource = async ({
	resource,
	parentResourceId,
}: {
	resource: ContentResource
	parentResourceId: string
}) => {
	const parentResource = await db.query.contentResource.findFirst({
		where: like(contentResource.id, `%${last(parentResourceId.split('-'))}%`),
		with: {
			resources: true,
		},
	})

	if (!parentResource) {
		throw new Error(`Workshop with id ${parentResourceId} not found`)
	}

	await db.insert(contentResourceResource).values({
		resourceOfId: parentResource.id,
		resourceId: resource.id,
		position: parentResource.resources.length,
	})

	const resourceResource = db.query.contentResourceResource.findFirst({
		where: and(
			eq(contentResourceResource.resourceOfId, parentResource.id),
			eq(contentResourceResource.resourceId, resource.id),
		),
		with: {
			resource: true,
		},
	})

	return resourceResource
}

/**
 * Updates the position of a resource within a parent resource
 *
 * @param currentParentResourceId - The current parent resource ID
 * @param parentResourceId - The target parent resource ID
 * @param resourceId - The ID of the resource to update
 * @param position - The new position for the resource
 * @returns The result of the update operation
 */
export const updateResourcePosition = async ({
	currentParentResourceId,
	parentResourceId,
	resourceId,
	position,
}: {
	currentParentResourceId: string
	parentResourceId: string
	resourceId: string
	position: number
}) => {
	const result = await db
		.update(contentResourceResource)
		.set({ position, resourceOfId: parentResourceId })
		.where(
			and(
				eq(contentResourceResource.resourceOfId, currentParentResourceId),
				eq(contentResourceResource.resourceId, resourceId),
			),
		)

	revalidateTag('posts')

	return result
}

/**
 * Type for position input items used in updateResourcePositions
 */
export type positionInputItem = {
	currentParentResourceId: string
	parentResourceId: string
	resourceId: string
	position: number
	children?: positionInputItem[]
}

/**
 * Reorders items in an Egghead playlist
 *
 * @param input - Array of resource IDs and positions
 * @param currentParentResourceId - The ID of the parent resource
 * @returns True if successful, null if no playlist ID is found
 */
async function reorderEggheadPlaylistItems(
	input: { resourceId: string; position: number }[],
	currentParentResourceId: string,
) {
	const currentParentResourcePost = await getPost(currentParentResourceId)
	const eggheadPlaylistId = currentParentResourcePost?.fields?.eggheadPlaylistId

	if (!eggheadPlaylistId) {
		return null
	}

	const tracklistAttributes = await Promise.all(
		input.map(async (item) => {
			const resource = await db.query.contentResource.findFirst({
				where: eq(contentResource.id, item.resourceId),
			})
			return {
				tracklistable_type: resource?.fields?.postType,
				tracklistable_id: resource?.fields?.eggheadLessonId,
				row_order_position: item.position,
			}
		}),
	)

	// Update each tracklist item's position in the playlist
	await Promise.all(
		tracklistAttributes.map((item) =>
			eggheadPgQuery(
				`UPDATE tracklists SET row_order = ${item.row_order_position} 
				WHERE tracklistable_id = ${item.tracklistable_id}
				AND playlist_id = ${eggheadPlaylistId}`,
			),
		),
	)

	return true
}

/**
 * Updates positions of multiple resources, syncing with both Sanity and Egghead
 *
 * @param input - Array of position input items
 * @returns The response from reordering Egghead playlist items
 * @throws {Error} If the user is not authorized
 */
export const updateResourcePositions = async (input: positionInputItem[]) => {
	const { session, ability } = await getServerAuthSession()

	if (!session?.user?.id || !ability.can('create', 'Content')) {
		throw new Error('Unauthorized')
	}

	const result = await db.transaction(async (trx) => {
		for (const { parentResourceId, resourceId, position, children } of input) {
			await trx
				.update(contentResourceResource)
				.set({ position, resourceOfId: parentResourceId })
				.where(
					and(
						eq(contentResourceResource.resourceOfId, parentResourceId),
						eq(contentResourceResource.resourceId, resourceId),
					),
				)
			for (const child of children || []) {
				await trx
					.update(contentResourceResource)
					.set({
						position: child.position,
						resourceOfId: child.parentResourceId,
					})
					.where(
						and(
							eq(
								contentResourceResource.resourceOfId,
								child.currentParentResourceId,
							),
							eq(contentResourceResource.resourceId, child.resourceId),
						),
					)
			}
		}
	})

	await reorderResourcesInSanityCourse({
		resources: input,
		parentResourceId: input?.[0]?.currentParentResourceId ?? '',
	})

	const response = await reorderEggheadPlaylistItems(
		input,
		input?.[0]?.currentParentResourceId ?? '',
	)

	return response
}

/**
 * Removes a section from a course and handles revalidation of paths
 *
 * @param sectionId - The ID of the section to remove
 * @param pathToRevalidate - The path to revalidate after removal
 * @returns The result of removing the section from its parent
 */
export async function removeSection(
	sectionId: string,
	pathToRevalidate: string,
) {
	await db.delete(contentResource).where(eq(contentResource.id, sectionId))

	revalidatePath(pathToRevalidate)
	return await db
		.delete(contentResourceResource)
		.where(eq(contentResourceResource.resourceId, sectionId))
}
