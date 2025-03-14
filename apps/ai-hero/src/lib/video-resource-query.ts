'use server'

import { courseBuilderAdapter, db } from '@/db'
import { contentResource, contentResourceResource } from '@/db/schema'
import {
	VIDEO_ATTACHED_EVENT,
	VIDEO_DETACHED_EVENT,
} from '@/inngest/events/video-attachment'
import { inngest } from '@/inngest/inngest.server'
import { log } from '@/server/logger'
import { and, desc, eq, notExists, notInArray, or, sql } from 'drizzle-orm'
import { z } from 'zod'

import { ContentResourceSchema } from '@coursebuilder/core/schemas/content-resource-schema'

export async function getVideoResource(id: string | null | undefined) {
	return courseBuilderAdapter.getVideoResource(id)
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
