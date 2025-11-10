import { db } from '@/db'
import { contentResource, contentResourceResource } from '@/db/schema'
import { env } from '@/env.mjs'
import { inngest } from '@/inngest/inngest.server'
import { log } from '@/server/logger'
import { guid } from '@/utils/guid'
import { eq, sql } from 'drizzle-orm'

import { VIDEO_RESOURCE_CREATED_EVENT } from '@coursebuilder/core/inngest/video-processing/events/event-video-resource'

import {
	BUNNY_TO_COURSEBUILDER_MIGRATION_EVENT,
	type BunnyToCoursebuilderMigration,
} from '../../events/bunny-collections'

/**
 * Bunny.net Video Library API client utilities
 *
 * Bunny.net Stream API uses:
 * - Video Library ID: Unique identifier for your video library
 * - CDN Hostname: URL for video delivery (e.g., yourlibrary.b-cdn.net)
 * - Stream API Key: For authenticating API requests
 *
 * Base URL: https://video.bunnycdn.com
 * API Documentation: https://docs.bunny.net/reference/stream-api-overview
 */

/**
 * Fetches all collections from a Bunny.net video library
 * Uses the Stream API: https://video.bunnycdn.com
 */
async function fetchBunnyCollections() {
	const apiKey = env.BUNNY_NET_API_KEY
	const libraryId = env.BUNNY_NET_VIDEO_LIBRARY_ID
	const baseUrl = 'https://video.bunnycdn.com'

	if (!apiKey) {
		throw new Error('BUNNY_NET_API_KEY environment variable is not set')
	}

	if (!libraryId) {
		throw new Error(
			'BUNNY_NET_VIDEO_LIBRARY_ID environment variable is not set',
		)
	}

	try {
		// Stream API endpoint for listing collections in a video library
		const response = await fetch(
			`${baseUrl}/library/${libraryId}/collections`,
			{
				headers: {
					AccessKey: apiKey,
					'Content-Type': 'application/json',
				},
			},
		)

		if (!response.ok) {
			const errorText = await response.text()
			throw new Error(
				`Bunny.net API error: ${response.status} ${response.statusText} - ${errorText}`,
			)
		}

		const data = await response.json()
		return data
	} catch (error) {
		if (error instanceof Error) {
			throw error
		}
		throw new Error(`Failed to fetch Bunny.net collections: ${String(error)}`)
	}
}

/**
 * Gets the public HLS URL for a Bunny.net video
 * Format: https://{cdn-hostname}/{guid}/playlist.m3u8
 *
 * Note: The videoLibraryId is NOT included in the URL path.
 * Always returns HLS playlist format (.m3u8) which is the correct format for Bunny.net Stream API.
 *
 * @param video - Video object from Bunny.net API
 * @returns Public URL for the video (HLS playlist)
 */
function getBunnyVideoPublicUrl(video: {
	guid: string
	videoLibraryId: number
	hasMP4Fallback?: boolean
}): string {
	const cdnHostname = env.BUNNY_NET_CDN_HOSTNAME

	if (!cdnHostname) {
		throw new Error('BUNNY_NET_CDN_HOSTNAME environment variable is not set')
	}

	// Bunny.net Stream API URL format:
	// https://{cdn-hostname}/{guid}/playlist.m3u8
	// Note: videoLibraryId is NOT included in the URL path
	return `https://${cdnHostname}/${video.guid}/playlist.m3u8`
}

/**
 * Gets the MP4 URL for a Bunny.net video (for Deepgram transcription)
 * Format: https://{cdn-hostname}/{guid}/play_{resolution}p.mp4
 *
 * @param video - Video object from Bunny.net API
 * @param resolution - Video resolution (default: 720p)
 * @returns Public MP4 URL for the video
 */
function getBunnyVideoMp4Url(
	video: {
		guid: string
		videoLibraryId: number
		hasMP4Fallback?: boolean
	},
	resolution: string = '720p',
): string {
	const cdnHostname = env.BUNNY_NET_CDN_HOSTNAME

	if (!cdnHostname) {
		throw new Error('BUNNY_NET_CDN_HOSTNAME environment variable is not set')
	}

	// Bunny.net MP4 URL format:
	// https://{cdn-hostname}/{guid}/play_{resolution}p.mp4
	// Example: https://vz-298a7a1a-813.b-cdn.net/{guid}/play_720p.mp4
	return `https://${cdnHostname}/${video.guid}/play_${resolution}.mp4`
}

/**
 * Fetches videos from a specific collection in a Bunny.net video library
 * Uses the Stream API: https://video.bunnycdn.com
 *
 * @param collectionId - The GUID of the collection (from the collections list)
 */
async function fetchCollectionVideos(collectionId: string) {
	const apiKey = env.BUNNY_NET_API_KEY
	const libraryId = env.BUNNY_NET_VIDEO_LIBRARY_ID
	const baseUrl = 'https://video.bunnycdn.com'

	if (!apiKey) {
		throw new Error('BUNNY_NET_API_KEY environment variable is not set')
	}

	if (!libraryId) {
		throw new Error(
			'BUNNY_NET_VIDEO_LIBRARY_ID environment variable is not set',
		)
	}

	try {
		// Stream API endpoint for listing videos in a collection
		// Uses query parameter format: /library/{libraryId}/videos?collectionId={collectionId}
		const url = `${baseUrl}/library/${libraryId}/videos?collectionId=${collectionId}`

		await log.info('bunny-api', {
			step: 'fetching-collection-videos',
			url,
			libraryId,
			collectionId,
		})

		const response = await fetch(url, {
			headers: {
				AccessKey: apiKey,
				'Content-Type': 'application/json',
			},
		})

		if (!response.ok) {
			const errorText = await response.text()
			await log.error('bunny-api', {
				step: 'api-error',
				status: response.status,
				statusText: response.statusText,
				errorText,
				url,
			})
			throw new Error(
				`Bunny.net API error: ${response.status} ${response.statusText} - ${errorText}`,
			)
		}

		const data = await response.json()
		return data
	} catch (error) {
		if (error instanceof Error) {
			throw error
		}
		throw new Error(
			`Failed to fetch videos for collection ${collectionId}: ${String(error)}`,
		)
	}
}

/**
 * Inngest function to migrate content from Bunny.net to CourseBuilder
 * This is a multi-step process:
 * 1. Discover collections from Bunny.net (shows all collections with video counts)
 * 2. Fetch videos for a specific collection (optional - if collectionId provided)
 *    - Fetches videos and extracts public URLs for MUX migration
 *    - For now, this is optional for testing/exploration
 *    - Eventually will process all collections automatically
 * 3. Create MUX assets from Bunny.net URLs (TODO)
 * 4. Create video resources in database (TODO)
 * 5. Create workshops/lessons structure (TODO)
 */
export const migrateBunnyToCoursebuilder = inngest.createFunction(
	{
		id: `migrate-bunny-to-coursebuilder`,
		name: 'Migrate Bunny.net to CourseBuilder',
	},
	{
		event: BUNNY_TO_COURSEBUILDER_MIGRATION_EVENT,
	},
	async ({ event, step, db: adapter }) => {
		const {
			collectionId,
			videoGuid,
			workshopId,
			createdById,
			dryRun = false,
		} = event.data

		if (!createdById && !dryRun) {
			throw new Error('createdById is required for migration')
		}

		await log.info('bunny-migration', {
			step: 'migration-started',
			collectionId: collectionId || 'all',
			dryRun,
		})

		// Step 1: Discover collections from Bunny.net
		const collections = await step.run(
			'discover bunny collections',
			async () => {
				await log.info('bunny-migration', {
					step: 'discover-collections',
					collectionId: collectionId || 'all',
				})

				try {
					const data = await fetchBunnyCollections()
					await log.info('bunny-migration', {
						step: 'collections-discovered',
						dataType: typeof data,
						isArray: Array.isArray(data),
						keys: data && typeof data === 'object' ? Object.keys(data) : null,
						// Log first collection structure to see what fields are available
						firstCollection:
							Array.isArray(data) && data.length > 0 ? data[0] : data,
						allCollections: JSON.stringify(data),
					})
					return data
				} catch (error) {
					await log.error('bunny-migration', {
						step: 'discover-collections-error',
						error: error instanceof Error ? error.message : String(error),
						stack: error instanceof Error ? error.stack : undefined,
					})
					throw error
				}
			},
		)

		// Step 2: Fetch videos for a specific collection (optional - if collectionId provided)
		// This is optional for now - you can invoke with a specific collectionId for testing
		// collectionId should be the GUID field from the collections list
		// Eventually will process all collections automatically
		// Also extracts public URLs for each video to prepare for MUX migration
		let videos = null
		if (collectionId) {
			videos = await step.run(
				`fetch videos for collection ${collectionId}`,
				async () => {
					await log.info('bunny-migration', {
						step: 'fetch-collection-videos',
						collectionId,
					})

					try {
						const videoData = await fetchCollectionVideos(collectionId)

						await log.info('bunny-migration', {
							step: 'videos-fetched',
							collectionId,
							dataType: typeof videoData,
							isArray: Array.isArray(videoData),
						})

						// Extract video array from response (handle different formats)
						let videoArray: any[] = []

						if (Array.isArray(videoData)) {
							videoArray = videoData
						} else if (
							videoData &&
							typeof videoData === 'object' &&
							'items' in videoData
						) {
							videoArray = (videoData as any).items || []
						} else if (videoData && typeof videoData === 'object') {
							// Try to find array in the object
							const keys = Object.keys(videoData)
							for (const key of keys) {
								if (Array.isArray((videoData as any)[key])) {
									videoArray = (videoData as any)[key]
									break
								}
							}
						}

						if (videoArray.length === 0) {
							await log.warn('bunny-migration', {
								step: 'no-videos-found-in-response',
								videoDataStructure: JSON.stringify(videoData).substring(0, 500),
							})
							return []
						}

						// Extract public URLs for each video (HLS for player, MP4 for Deepgram)
						const videosWithUrls = videoArray.map((video: any) => {
							const publicUrl = getBunnyVideoPublicUrl({
								guid: video.guid,
								videoLibraryId: video.videoLibraryId,
								hasMP4Fallback: video.hasMP4Fallback,
							})
							const mp4Url = getBunnyVideoMp4Url({
								guid: video.guid,
								videoLibraryId: video.videoLibraryId,
								hasMP4Fallback: video.hasMP4Fallback,
							})

							return {
								...video,
								publicUrl, // HLS URL for player
								mp4Url, // MP4 URL for Deepgram
							}
						})

						await log.info('bunny-migration', {
							step: 'videos-with-urls-extracted',
							collectionId,
							totalVideos: videosWithUrls.length,
							sampleUrls: videosWithUrls.slice(0, 3).map((v: any) => ({
								title: v.title,
								url: v.publicUrl,
							})),
						})

						return videosWithUrls
					} catch (error) {
						await log.error('bunny-migration', {
							step: 'fetch-videos-error',
							collectionId,
							error: error instanceof Error ? error.message : String(error),
							stack: error instanceof Error ? error.stack : undefined,
							errorDetails:
								error instanceof Error
									? {
											name: error.name,
											message: error.message,
										}
									: error,
						})
						// Re-throw so we can see the actual error in Inngest
						throw error
					}
				},
			)
		}

		// Step 3: Find specific video by GUID (if provided for testing)
		let selectedVideo = null
		if (videoGuid && videos && Array.isArray(videos)) {
			selectedVideo = await step.run(
				`find video by GUID ${videoGuid}`,
				async () => {
					const video = videos.find((v: any) => v.guid === videoGuid)
					if (!video) {
						throw new Error(`Video with GUID ${videoGuid} not found`)
					}
					await log.info('bunny-migration', {
						step: 'video-found',
						videoGuid,
						videoTitle: video.title,
						publicUrl: video.publicUrl,
					})
					return video
				},
			)
		}

		// Step 4: Create video resource in database (skip MUX asset creation since Bunny.net HLS URLs can't be used for MUX assets)
		// Instead, we'll store the Bunny.net HLS URL directly and use it with MuxPlayer's src prop
		let videoResource = null
		if (selectedVideo && !dryRun) {
			videoResource = await step.run(
				'create video resource in database',
				async () => {
					if (!selectedVideo.publicUrl) {
						throw new Error('Video public URL is missing')
					}

					try {
						// Check if video resource already exists (by Bunny.net GUID)
						// Use raw SQL query to search JSON field
						const existingQuery = sql`
							SELECT * FROM ${contentResource}
							WHERE type = 'videoResource'
							AND JSON_EXTRACT(fields, '$.bunnyNetGuid') = ${selectedVideo.guid}
							LIMIT 1
						`
						const existingResult = await db.execute(existingQuery)

						if (existingResult.rows.length > 0) {
							const existingResourceRow = existingResult.rows[0] as any

							// Parse fields if it's a string, otherwise use as-is
							let fields = existingResourceRow.fields
							if (typeof fields === 'string') {
								try {
									fields = JSON.parse(fields)
								} catch (e) {
									fields = {}
								}
							} else if (!fields) {
								fields = {}
							}

							const existingResource = {
								id: existingResourceRow.id,
								type: existingResourceRow.type,
								fields,
							}

							await log.info('bunny-migration', {
								step: 'video-resource-already-exists',
								videoResourceId: existingResource.id,
								bunnyNetGuid: selectedVideo.guid,
							})

							// Update with new HLS URL if needed
							if (
								existingResource.fields?.bunnyNetHlsUrl !==
								selectedVideo.publicUrl
							) {
								await adapter.updateContentResourceFields({
									id: existingResource.id,
									fields: {
										...existingResource.fields,
										bunnyNetHlsUrl: selectedVideo.publicUrl,
										originalMediaUrl: selectedVideo.publicUrl,
										state: 'ready',
										title: selectedVideo.title,
										duration: selectedVideo.length || null,
									},
								})

								await log.info('bunny-migration', {
									step: 'video-resource-updated',
									videoResourceId: existingResource.id,
									bunnyNetHlsUrl: selectedVideo.publicUrl,
								})
							}

							// Return the updated resource by fetching it again
							const updatedResource = await adapter.getContentResource(
								existingResource.id,
							)
							return updatedResource || existingResource
						}

						// Generate unique ID for video resource (like other resources in the codebase)
						const videoGuid = guid()
						const videoResourceId = `video_${videoGuid}`

						// Create new video resource with Bunny.net HLS URL
						// Store the HLS URL in fields.bunnyNetHlsUrl for use with MuxPlayer's src prop
						const resource = await adapter.createContentResource({
							id: videoResourceId,
							type: 'videoResource',
							fields: {
								state: 'ready', // Bunny.net videos are already available
								originalMediaUrl: selectedVideo.publicUrl,
								bunnyNetHlsUrl: selectedVideo.publicUrl, // HLS URL for MuxPlayer src prop
								muxPlaybackId: null, // No MUX asset for Bunny.net videos
								muxAssetId: null, // No MUX asset for Bunny.net videos
								title: selectedVideo.title,
								duration: selectedVideo.length || null,
								// Store Bunny.net GUID in fields for reference
								bunnyNetGuid: selectedVideo.guid,
							},
							createdById: createdById!,
						})

						await log.info('bunny-migration', {
							step: 'video-resource-created',
							videoResourceId: resource.id,
							bunnyNetGuid: selectedVideo.guid,
							bunnyNetHlsUrl: selectedVideo.publicUrl,
						})

						return resource
					} catch (error) {
						await log.error('bunny-migration', {
							step: 'create-video-resource-error',
							error: error instanceof Error ? error.message : String(error),
							stack: error instanceof Error ? error.stack : undefined,
							videoGuid: selectedVideo.guid,
						})
						throw error
					}
				},
			)
		}

		// Step 5: Trigger transcript generation for Bunny.net videos
		// Use MP4 URL for Deepgram (HLS is not supported)
		// HLS URL is still saved in database for player
		if (videoResource && selectedVideo.mp4Url && !dryRun) {
			await step.run(
				'trigger transcript generation for bunny.net video',
				async () => {
					await log.info('bunny-migration', {
						step: 'transcript-generation-triggered',
						videoResourceId: videoResource.id,
						mp4Url: selectedVideo.mp4Url,
						hlsUrl: selectedVideo.publicUrl,
						note: 'Using Bunny.net MP4 URL for Deepgram transcription',
					})
				},
			)

			// Send event to trigger transcript generation with MP4 URL
			// Deepgram requires MP4, not HLS
			await step.sendEvent('send transcript generation event', {
				name: VIDEO_RESOURCE_CREATED_EVENT,
				data: {
					videoResourceId: videoResource.id,
					originalMediaUrl: selectedVideo.mp4Url, // Bunny.net MP4 URL for Deepgram
					createdById: createdById!, // Pass through for webhook handler
				},
			})
		} else if (videoResource && !selectedVideo.mp4Url && !dryRun) {
			await step.run('skip transcript generation - no MP4 URL', async () => {
				await log.warn('bunny-migration', {
					step: 'transcript-generation-skipped',
					videoResourceId: videoResource.id,
					reason: 'No MP4 URL available for Deepgram',
				})
			})
		}

		// Step 6: Create lesson linked to video resource (if video resource created)
		let lesson = null
		if (videoResource && !dryRun) {
			lesson = await step.run('create lesson', async () => {
				const lessonGuid = guid()
				const lessonId = `lesson_${lessonGuid}`
				const lessonTitle = selectedVideo.title || 'Untitled Lesson'

				// Create lesson content resource
				const lessonResource = await adapter.createContentResource({
					id: lessonId,
					type: 'lesson',
					fields: {
						title: lessonTitle,
						state: 'draft',
						visibility: 'unlisted',
						slug: `${lessonTitle.toLowerCase().replace(/\s+/g, '-')}~${lessonGuid}`,
						lessonType: 'lesson',
					},
					createdById: createdById!,
				})

				// Link video resource to lesson using adapter method
				await adapter.addResourceToResource({
					parentResourceId: lessonId,
					childResourceId: videoResource.id,
				})

				await log.info('bunny-migration', {
					step: 'lesson-created',
					lessonId,
					lessonTitle,
					videoResourceId: videoResource.id,
				})

				return lessonResource
			})
		}

		// Step 7: Link lesson to workshop (if workshopId provided)
		if (lesson && workshopId && !dryRun) {
			await step.run('link lesson to workshop', async () => {
				// Use adapter method to link lesson to workshop
				// The adapter handles position calculation automatically
				const resourceJoin = await adapter.addResourceToResource({
					parentResourceId: workshopId,
					childResourceId: lesson.id,
				})

				await log.info('bunny-migration', {
					step: 'lesson-linked-to-workshop',
					lessonId: lesson.id,
					workshopId,
					resourceJoinId: resourceJoin?.id,
				})
			})
		}

		// Step 8: Generate migration report
		const report = await step.run('generate migration report', async () => {
			const collectionsArray = Array.isArray(collections)
				? collections
				: [collections]
			const report = {
				migratedAt: new Date().toISOString(),
				dryRun,
				collections: collectionsArray,
				videos: videos
					? {
							collectionId,
							data: videos,
						}
					: null,
				selectedVideo: selectedVideo
					? {
							guid: selectedVideo.guid,
							title: selectedVideo.title,
							publicUrl: selectedVideo.publicUrl,
						}
					: null,
				videoResource: videoResource
					? {
							id: videoResource.id,
							bunnyNetHlsUrl: videoResource.fields?.bunnyNetHlsUrl,
							muxPlaybackId: videoResource.fields?.muxPlaybackId,
							bunnyNetGuid: videoResource.fields?.bunnyNetGuid,
						}
					: null,
				lesson: lesson
					? {
							id: lesson.id,
							title: lesson.fields?.title,
						}
					: null,
				workshopId: workshopId || null,
				summary: {
					totalCollections: collectionsArray.length,
					hasVideos: videos !== null,
					totalVideos: videos?.length || 0,
					videoProcessed: selectedVideo !== null,
					videoResourceCreated: videoResource !== null,
					lessonCreated: lesson !== null,
					lessonLinkedToWorkshop: lesson !== null && workshopId !== null,
					status: dryRun ? 'dry-run-complete' : 'migration-complete',
				},
			}

			await log.info('bunny-migration', {
				step: 'migration-report-generated',
				report: JSON.stringify(report, null, 2),
			})

			return report
		})

		return report
	},
)
