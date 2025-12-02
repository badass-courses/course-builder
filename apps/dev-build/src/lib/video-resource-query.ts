'use server'

import { courseBuilderAdapter, db } from '@/db'
import { contentResource, contentResourceResource } from '@/db/schema'
import {
	VIDEO_ATTACHED_EVENT,
	VIDEO_DETACHED_EVENT,
} from '@/inngest/events/video-attachment'
import { inngest } from '@/inngest/inngest.server'
import { log } from '@/server/logger'
import { and, desc, eq, lt, notExists, notInArray, or, sql } from 'drizzle-orm'
import { z } from 'zod'

import { ContentResourceSchema } from '@coursebuilder/core/schemas/content-resource-schema'

export async function getVideoResource(id: string | null | undefined) {
	return courseBuilderAdapter.getVideoResource(id)
}

export type PaginatedVideoResourcesResponse = {
	items: z.infer<typeof ContentResourceSchema>[]
	hasNextPage: boolean
	nextCursor: string | null
	error?: string
}

/**
 * Get paginated video resources with cursor-based pagination
 * @param limit - Number of items to return (default: 20)
 * @param cursor - Cursor for pagination (ISO date string)
 * @returns Object with video resources, hasNextPage, and nextCursor
 */
export async function getPaginatedVideoResources(
	limit: number = 20,
	cursor?: string,
): Promise<PaginatedVideoResourcesResponse> {
	try {
		// Validate limit parameter
		if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
			await log.warn('video-resources.paginated.invalid-limit', {
				providedLimit: limit,
				defaultingTo: 20,
			})
			limit = 20 // Default to safe value
		}

		// Validate cursor parameter if provided
		let cursorDate: Date | null = null
		if (cursor) {
			if (typeof cursor !== 'string' || cursor.trim() === '') {
				throw new Error(
					`Invalid cursor format: cursor must be a non-empty string`,
				)
			}

			// Validate ISO date string format and create Date object
			cursorDate = new Date(cursor)
			if (isNaN(cursorDate.getTime())) {
				throw new Error(
					`Invalid cursor date: "${cursor}" is not a valid ISO date string`,
				)
			}

			// Additional validation: ensure date is not in the future (with some tolerance)
			const now = new Date()
			const maxFutureDate = new Date(now.getTime() + 1000 * 60 * 60) // 1 hour tolerance
			if (cursorDate > maxFutureDate) {
				throw new Error(
					`Invalid cursor date: "${cursor}" is too far in the future`,
				)
			}
		}

		const conditions = [eq(contentResource.type, 'videoResource')]

		if (cursorDate) {
			conditions.push(lt(contentResource.createdAt, cursorDate))
		}

		const videoResources = await db.query.contentResource.findMany({
			where: and(...conditions),
			with: {
				resources: {
					with: {
						resource: true,
					},
				},
			},
			orderBy: [desc(contentResource.createdAt)],
			limit: limit + 1, // Fetch one extra to check if there's a next page
		})

		const hasNextPage = videoResources.length > limit
		const items = hasNextPage ? videoResources.slice(0, limit) : videoResources
		const lastItem = items[items.length - 1]
		const nextCursor =
			hasNextPage && items.length > 0 && lastItem?.createdAt
				? lastItem.createdAt.toISOString()
				: null

		await log.info('video-resources.paginated.fetch.success', {
			count: items.length,
			hasNextPage,
			cursor,
			validatedLimit: limit,
		})

		const validatedResults = z.array(ContentResourceSchema).safeParse(items)

		if (!validatedResults.success) {
			await log.error('video-resources.paginated.validation.failed', {
				error: validatedResults.error.format(),
			})
			return {
				items: [],
				hasNextPage: false,
				nextCursor: null,
			}
		}

		return {
			items: validatedResults.data,
			hasNextPage,
			nextCursor,
		}
	} catch (error) {
		await log.error('video-resources.paginated.fetch.failed', {
			error: error instanceof Error ? error.message : String(error),
			stack: error instanceof Error ? error.stack : undefined,
			providedCursor: cursor,
			providedLimit: limit,
		})

		// Return empty result with descriptive error for client
		return {
			items: [],
			hasNextPage: false,
			nextCursor: null,
			error: error instanceof Error ? error.message : 'Unknown error occurred',
		}
	}
}

export async function getAllVideoResources() {
	const ALLOWED_ASSOCIATED_TYPES = ['raw-transcript']

	try {
		const videoResources = await db.query.contentResource.findMany({
			where: and(eq(contentResource.type, 'videoResource')),
			with: {
				resources: {
					with: {
						resource: true,
					},
				},
			},
			orderBy: [desc(contentResource.createdAt)],
		})

		await log.info('video-resources.fetch.success', {
			count: videoResources.length,
		})

		const validatedResults = z
			.array(ContentResourceSchema)
			.safeParse(videoResources)

		if (!validatedResults.success) {
			await log.error('video-resources.validation.failed', {
				error: validatedResults.error.format(),
			})
			return []
		}

		return validatedResults.data
	} catch (error) {
		await log.error('video-resources.fetch.failed', {
			error: error instanceof Error ? error.message : String(error),
			stack: error instanceof Error ? error.stack : undefined,
		})
		return []
	}
}

/**
 * Attaches a video resource to a post, replacing any existing video resource
 * @param postId - The ID of the post
 * @param videoResourceId - The ID of the video resource to attach
 * @returns True if successful, false otherwise
 */
export async function attachVideoResourceToPost(
	postId: string,
	videoResourceId: string,
) {
	try {
		// First, check if the post already has a video resource attached
		const existingVideoResources =
			await db.query.contentResourceResource.findMany({
				where: and(
					eq(contentResourceResource.resourceOfId, postId),
					eq(
						sql`(SELECT type FROM ${contentResource} WHERE id = ${contentResourceResource.resourceId})`,
						'videoResource',
					),
				),
				with: {
					resource: true,
				},
			})

		// If there are existing video resources, detach them
		if (existingVideoResources.length > 0) {
			for (const existingResource of existingVideoResources) {
				await db
					.delete(contentResourceResource)
					.where(
						and(
							eq(contentResourceResource.resourceOfId, postId),
							eq(
								contentResourceResource.resourceId,
								existingResource.resourceId,
							),
						),
					)

				await log.info('post.video.detached', {
					postId,
					videoResourceId: existingResource.resourceId,
				})

				// Send Inngest event for video detachment
				try {
					await inngest.send({
						name: VIDEO_DETACHED_EVENT,
						data: {
							postId,
							videoResourceId: existingResource.resourceId,
						},
					})
				} catch (error) {
					await log.error('post.video.detach.inngest.failed', {
						error: error instanceof Error ? error.message : String(error),
						stack: error instanceof Error ? error.stack : undefined,
						postId,
						videoResourceId: existingResource.resourceId,
					})
				}
			}
		}

		// Now attach the new video resource
		await db
			.insert(contentResourceResource)
			.values({ resourceOfId: postId, resourceId: videoResourceId })

		await log.info('post.video.attached', {
			postId,
			videoResourceId,
		})

		// Send Inngest event for video attachment
		try {
			await inngest.send({
				name: VIDEO_ATTACHED_EVENT,
				data: {
					postId,
					videoResourceId,
				},
			})
		} catch (error) {
			await log.error('post.video.attach.inngest.failed', {
				error: error instanceof Error ? error.message : String(error),
				stack: error instanceof Error ? error.stack : undefined,
				postId,
				videoResourceId,
			})
		}

		return true
	} catch (error) {
		await log.error('post.video.attach.failed', {
			error: error instanceof Error ? error.message : String(error),
			stack: error instanceof Error ? error.stack : undefined,
			postId,
			videoResourceId,
		})
		return false
	}
}

/**
 * Detaches a video resource from a post
 * @param postId - The ID of the post
 * @param videoResourceId - The ID of the video resource to detach
 * @returns True if successful, false otherwise
 */
export async function detachVideoResourceFromPost(
	postId: string,
	videoResourceId: string,
) {
	try {
		await db
			.delete(contentResourceResource)
			.where(
				and(
					eq(contentResourceResource.resourceOfId, postId),
					eq(contentResourceResource.resourceId, videoResourceId),
				),
			)

		await log.info('post.video.detached', {
			postId,
			videoResourceId,
		})

		// Send Inngest event for video detachment
		try {
			await inngest.send({
				name: VIDEO_DETACHED_EVENT,
				data: {
					postId,
					videoResourceId,
				},
			})
		} catch (error) {
			await log.error('post.video.detach.inngest.failed', {
				error: error instanceof Error ? error.message : String(error),
				stack: error instanceof Error ? error.stack : undefined,
				postId,
				videoResourceId,
			})
		}

		return true
	} catch (error) {
		await log.error('post.video.detach.failed', {
			error: error instanceof Error ? error.message : String(error),
			stack: error instanceof Error ? error.stack : undefined,
			postId,
			videoResourceId,
		})
		return false
	}
}

/**
 * Deletes a video resource and all its associations
 * @param videoResourceId - The ID of the video resource to delete
 * @returns True if successful, false otherwise
 */
export async function deleteVideoResource(videoResourceId: string) {
	try {
		// First, delete any associations where this video is attached to other resources
		await db
			.delete(contentResourceResource)
			.where(eq(contentResourceResource.resourceId, videoResourceId))

		// Also delete any child resources associated with this video (like transcripts)
		await db
			.delete(contentResourceResource)
			.where(eq(contentResourceResource.resourceOfId, videoResourceId))

		// Finally, delete the video resource itself
		await db
			.delete(contentResource)
			.where(
				and(
					eq(contentResource.id, videoResourceId),
					eq(contentResource.type, 'videoResource'),
				),
			)

		await log.info('video-resource.deleted', {
			videoResourceId,
		})

		return true
	} catch (error) {
		await log.error('video-resource.delete.failed', {
			error: error instanceof Error ? error.message : String(error),
			stack: error instanceof Error ? error.stack : undefined,
			videoResourceId,
		})
		return false
	}
}
