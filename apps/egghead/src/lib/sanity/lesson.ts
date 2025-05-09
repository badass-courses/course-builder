'use server'

import { db } from '@/db'
import { contentResource } from '@/db/schema'
import { getEggheadLesson, type EggheadLesson } from '@/lib/egghead'
import type { Post } from '@/lib/posts'
import { getPost } from '@/lib/posts-query'
import { sanityWriteClient } from '@/server/sanity-write-client'
import { eq } from 'drizzle-orm'

import type { VideoResource } from '@coursebuilder/core/schemas'

import { getSanityCollaborator } from './collaborator'
import type {
	SanityArrayElementReference,
	SanityLessonDocument,
	SoftwareLibraryArrayObject,
} from './types'
import { createSanityArrayElementReference } from './utils'

/**
 * Creates a Sanity video resource document from a VideoResource
 * @param videoResource - The video resource to create in Sanity
 * @returns The created Sanity video resource document
 */
export async function createSanityVideoResource(videoResource: VideoResource) {
	const { muxPlaybackId, muxAssetId, transcript, srt, id } = videoResource

	const streamUrl =
		muxPlaybackId && `https://stream.mux.com/${muxPlaybackId}.m3u8`

	return await sanityWriteClient
		.create({
			_type: 'videoResource',
			mediaUrls: {
				hlsUrl: streamUrl || '',
			},
			muxAsset: {
				muxAssetId,
				muxPlaybackId,
			},
			transcript: {
				srt,
				text: transcript,
			},
		})
		.then((response) => {
			return response
		})
}

/**
 * Replaces resources in a Sanity lesson with a new video resource
 * @param post - The post containing the lesson information
 * @param eggheadLessonId - The ID of the Egghead lesson
 * @param videoResourceId - The ID of the video resource
 * @returns The updated Sanity lesson document
 */
export async function replaceSanityLessonResources({
	post,
	eggheadLessonId,
	videoResourceId,
}: {
	post: Post
	eggheadLessonId: number | null | undefined
	videoResourceId: string | null | undefined
}) {
	if (!eggheadLessonId) {
		throw new Error('Egghead lesson ID is required.')
	}

	console.log(
		`[replaceSanityLessonResources] Starting for lesson ${eggheadLessonId}, videoResourceId: ${videoResourceId}`,
	)

	const sanityLesson = await getSanityLessonForEggheadLessonId(eggheadLessonId)

	if (!sanityLesson) {
		console.error(
			`[replaceSanityLessonResources] Sanity lesson with id ${eggheadLessonId} not found.`,
		)
		throw new Error(`Sanity lesson with id ${eggheadLessonId} not found.`)
	}

	// Initialize an update object with basic properties
	const updateObj: Record<string, any> = {
		title: post.fields.title,
		description: post.fields.description || '',
	}

	// Only try to set resources if we have a videoResourceId
	if (videoResourceId) {
		try {
			// Check if the referenced video resource exists in Sanity
			console.log(
				`[replaceSanityLessonResources] Checking if video resource exists: ${videoResourceId}`,
			)
			const resourceExists = await checkVideoResourceExists(videoResourceId)

			if (resourceExists) {
				console.log(
					`[replaceSanityLessonResources] Video resource exists, creating reference`,
				)
				updateObj.resources = [
					createSanityArrayElementReference(videoResourceId),
				]
			} else {
				console.log(
					`[replaceSanityLessonResources] Video resource does not exist in Sanity: ${videoResourceId}`,
				)
				// Don't add the resource to the update if it doesn't exist
				// Maintain existing resources to avoid clearing them
				updateObj.resources = undefined
			}
		} catch (error) {
			console.error(
				`[replaceSanityLessonResources] Error checking video resource: ${error}`,
			)
			// In case of error, don't update resources
			updateObj.resources = undefined
		}
	} else {
		console.log(
			`[replaceSanityLessonResources] No videoResourceId provided, skipping resources update`,
		)
	}

	console.log(`[replaceSanityLessonResources] Updating lesson with:`, updateObj)
	return await sanityWriteClient
		.patch(sanityLesson._id as string)
		.set(updateObj)
		.commit()
		.catch((error) => {
			console.error(
				`[replaceSanityLessonResources] Error updating Sanity lesson:`,
				error,
			)
			throw error
		})
}

/**
 * Checks if a video resource exists in Sanity
 * @param videoResourceId - The ID of the video resource to check
 * @returns True if the resource exists, false otherwise
 */
async function checkVideoResourceExists(
	videoResourceId: string,
): Promise<boolean> {
	try {
		const result = await sanityWriteClient.fetch(
			`*[_id == $videoResourceId][0]`,
			{ videoResourceId },
		)
		return !!result
	} catch (error) {
		console.error(
			`[checkVideoResourceExists] Error checking if video resource exists:`,
			error,
		)
		return false
	}
}

/**
 * Patches a Sanity lesson with a video resource reference
 * @param eggheadLessonId - The ID of the Egghead lesson
 * @param videoResourceDocumentId - The ID of the video resource document
 * @returns The updated Sanity lesson document
 */
export async function patchSanityLessonWithVideoResourceReference(
	eggheadLessonId: number | null | undefined,
	videoResourceDocumentId: string,
) {
	if (!eggheadLessonId) {
		throw new Error('Egghead lesson ID is required.')
	}

	const sanityLesson = await getSanityLessonForEggheadLessonId(eggheadLessonId)

	if (!sanityLesson) {
		throw new Error(`Sanity lesson with id ${eggheadLessonId} not found.`)
	}

	return await sanityWriteClient
		.patch(sanityLesson._id as string)
		.set({
			resources: [createSanityArrayElementReference(videoResourceDocumentId)],
		})
		.commit()
}

/**
 * Gets a Sanity lesson document for an Egghead lesson ID
 * @param eggheadLessonId - The ID of the Egghead lesson
 * @returns The Sanity lesson document, or null if not found
 */
export async function getSanityLessonForEggheadLessonId(
	eggheadLessonId: number | null | undefined,
): Promise<SanityLessonDocument | null> {
	if (!eggheadLessonId) return null

	return await sanityWriteClient.fetch(
		`*[_type == "lesson" && railsLessonId == $eggheadLessonId][0]`,
		{ eggheadLessonId },
	)
}

/**
 * Updates a Sanity lesson with information from a post
 * @param eggheadLessonId - The ID of the Egghead lesson
 * @param lesson - The post containing lesson information
 * @returns The updated Sanity lesson document
 */
export async function updateSanityLesson(
	eggheadLessonId: number | null | undefined,
	lesson?: Post | null,
) {
	if (!eggheadLessonId || !lesson) {
		return null
	}

	const sanityLesson = await getSanityLessonForEggheadLessonId(eggheadLessonId)

	if (!sanityLesson) {
		throw new Error(`Sanity lesson with id ${eggheadLessonId} not found.`)
	}

	const eggheadLesson = await getEggheadLesson(eggheadLessonId)

	if (!eggheadLesson) {
		throw new Error(`Egghead lesson with id ${eggheadLessonId} not found.`)
	}

	const contentResourceData = await db.query.contentResource.findFirst({
		where: eq(contentResource.id, lesson.id),
	})

	let videoResourceReference
	if (
		contentResourceData?.fields &&
		typeof contentResourceData.fields === 'object' &&
		'videoResourceId' in contentResourceData.fields
	) {
		videoResourceReference = createSanityArrayElementReference(
			contentResourceData.fields.videoResourceId as string,
		)
	}

	return await sanityWriteClient
		.patch(sanityLesson._id as string)
		.set({
			title: lesson.fields.title,
			slug: {
				_type: 'slug',
				current: lesson.fields.slug || '',
			},
			description: lesson.fields.description || '',
			accessLevel: eggheadLesson.is_pro ? 'pro' : 'free',
			resources: videoResourceReference ? [videoResourceReference] : undefined,
		})
		.commit()
}

/**
 * Creates a Sanity lesson document
 * @param eggheadLesson - The Egghead lesson data
 * @param collaborator - Reference to the collaborator
 * @param softwareLibraries - Software libraries used in the lesson
 * @returns The created Sanity lesson document
 */
export async function createSanityLesson(
	eggheadLesson: EggheadLesson,
	collaborator: SanityArrayElementReference,
	softwareLibraries: SoftwareLibraryArrayObject[],
) {
	const { id, slug, title, is_pro } = eggheadLesson
	const description = eggheadLesson.summary || ''

	// Check if lesson exists first
	const existingLesson = await getSanityLessonForEggheadLessonId(id)

	if (existingLesson) {
		return existingLesson
	}

	return await sanityWriteClient.create({
		_type: 'lesson',
		title,
		slug: {
			_type: 'slug',
			current: slug,
		},
		description,
		railsLessonId: id,
		softwareLibraries,
		collaborators: [collaborator],
		status: 'draft',
		accessLevel: is_pro ? 'pro' : 'free',
	})
}
