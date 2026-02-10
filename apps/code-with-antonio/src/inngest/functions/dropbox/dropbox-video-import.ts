/**
 * ============================================================================
 * DROPBOX VIDEO IMPORT WORKFLOW
 * ============================================================================
 *
 * This Inngest function imports videos from Dropbox into CourseBuilder.
 * It creates a workshop with MUX assets, generates transcripts,
 * and builds lessons attached directly to the workshop (no sections).
 *
 * ============================================================================
 * EXPECTED FOLDER STRUCTURE:
 * ============================================================================
 *
 * /Workshop Folder/
 *   ├── 01_POLARIS_PROJECT_SETUP.mp4
 *   ├── 02_POLARIS_GETTING_STARTED.mp4
 *   ├── 03_POLARIS_FIRST_COMPONENT.mp4
 *   └── ...
 *
 * ============================================================================
 * NAMING CONVENTIONS:
 * ============================================================================
 *
 * WORKSHOP NAME = Root folder name (cleaned up)
 *    "/Workshops/POLARIS" → Workshop: "Polaris"
 *
 * LESSON NAME = Video filename (cleaned up)
 *    "01_POLARIS_PROJECT_SETUP.mp4" → Lesson: "Project Setup"
 *    - Strip number prefix (01_)
 *    - Strip "POLARIS_" prefix
 *    - Convert UPPER_SNAKE_CASE to Title Case
 *
 * ORDER = Number prefix in filename
 *    "01_POLARIS_PROJECT_SETUP.mp4" → Position 1
 *
 * ============================================================================
 * WORKFLOW:
 * ============================================================================
 *
 * 1. Discover Dropbox content (list videos in folder)
 * 2. Create workshop from folder name
 * 3. Process all videos as direct lessons attached to workshop
 * 4. Generate report
 *
 * ============================================================================
 * HOW TO TRIGGER:
 * ============================================================================
 *
 * POST /api/dropbox/migrate
 * {
 *   "folderPath": "/Workshops/POLARIS",
 *   "createdById": "user_xyz789",
 *   "dryRun": false
 * }
 *
 * ============================================================================
 * ENVIRONMENT VARIABLES REQUIRED:
 * ============================================================================
 *
 * DROPBOX_ACCESS_TOKEN - Get from https://www.dropbox.com/developers/apps
 * DROPBOX_TEAM_MEMBER_ID - Optional: Team member ID for Dropbox Business
 * DROPBOX_TEAM_NAMESPACE_ID - Optional: Team namespace ID for shared folders
 *
 * ============================================================================
 */

import { env } from '@/env.mjs'
import { inngest } from '@/inngest/inngest.server'
import { guid } from '@/utils/guid'

import { VIDEO_RESOURCE_CREATED_EVENT } from '@coursebuilder/core/inngest/video-processing/events/event-video-resource'
import { createMuxAsset } from '@coursebuilder/core/lib/mux'

import { DROPBOX_TO_COURSEBUILDER_MIGRATION_EVENT } from '../../events/dropbox-migration'

// ============================================================================
// DROPBOX API TYPES
// ============================================================================

interface DropboxFile {
	'.tag': 'file' | 'folder'
	name: string
	path_lower: string
	path_display: string
	id: string
	size?: number
}

interface DropboxListFolderResponse {
	entries: DropboxFile[]
	cursor: string
	has_more: boolean
}

interface DropboxTemporaryLinkResponse {
	metadata: DropboxFile
	link: string
}

// ============================================================================
// RESULT TYPES
// ============================================================================

interface ProcessedVideo {
	video: DropboxFile
	muxAsset: any
	videoResource: any
	lesson: any
}

// ============================================================================
// DROPBOX API FUNCTIONS
// ============================================================================

function getDropboxHeaders(): Record<string, string> {
	const headers: Record<string, string> = {
		Authorization: `Bearer ${env.DROPBOX_ACCESS_TOKEN}`,
		'Content-Type': 'application/json',
	}

	if (env.DROPBOX_TEAM_MEMBER_ID) {
		let teamMemberId = env.DROPBOX_TEAM_MEMBER_ID.trim()
		if (
			!teamMemberId.startsWith('dbmid:') &&
			!teamMemberId.startsWith('dbid:')
		) {
			teamMemberId = `dbmid:${teamMemberId}`
		}
		headers['Dropbox-API-Select-User'] = teamMemberId.trim()
	}

	if (env.DROPBOX_TEAM_NAMESPACE_ID) {
		const pathRoot = JSON.stringify({
			'.tag': 'namespace_id',
			namespace_id: env.DROPBOX_TEAM_NAMESPACE_ID.trim(),
		})
		headers['Dropbox-API-Path-Root'] = pathRoot
	}

	return headers
}

function normalizePathForNamespace(path: string): string {
	if (env.DROPBOX_TEAM_NAMESPACE_ID) {
		if (path.startsWith('/_egghead-team')) {
			path = path.substring('/_egghead-team'.length)
			if (!path || path === '/') {
				return ''
			}
		}
		if (path && !path.startsWith('/')) {
			path = '/' + path
		}
	}

	if (path === '/') {
		return ''
	}

	return path
}

async function listDropboxFolder(path: string): Promise<DropboxFile[]> {
	const accessToken = env.DROPBOX_ACCESS_TOKEN

	if (!accessToken) {
		throw new Error('DROPBOX_ACCESS_TOKEN environment variable is not set')
	}

	const headers = getDropboxHeaders()
	const normalizedPath = normalizePathForNamespace(path)

	const pathRootUsed = env.DROPBOX_TEAM_NAMESPACE_ID
	console.log('[dropbox-import] Listing folder', {
		originalPath: path,
		normalizedPath,
		pathRootSet: !!pathRootUsed,
		pathRootNamespaceId: pathRootUsed || null,
	})

	let response = await fetch('https://api.dropboxapi.com/2/files/list_folder', {
		method: 'POST',
		headers,
		body: JSON.stringify({
			path: normalizedPath,
			recursive: false,
			include_media_info: true,
			include_deleted: false,
		}),
	})

	// On path/not_found with team namespace: retry with casing fix for "02 areas" -> "02 Areas" (team folder names often use capital A)
	if (
		!response.ok &&
		response.status === 409 &&
		pathRootUsed &&
		(normalizedPath.includes('02 areas') || normalizedPath.includes('02 Areas'))
	) {
		const altPath = normalizedPath.replace(/\/02 areas\//i, '/02 Areas/')
		if (altPath !== normalizedPath) {
			console.log('[dropbox-import] Retrying with casing-corrected path', {
				normalizedPath,
				altPath,
			})
			response = await fetch('https://api.dropboxapi.com/2/files/list_folder', {
				method: 'POST',
				headers,
				body: JSON.stringify({
					path: altPath,
					recursive: false,
					include_media_info: true,
					include_deleted: false,
				}),
			})
			if (response.ok) {
				const data: DropboxListFolderResponse = await response.json()
				let allEntries = data.entries
				let hasMore = data.has_more
				let cursor = data.cursor
				while (hasMore) {
					const continueResponse = await fetch(
						'https://api.dropboxapi.com/2/files/list_folder/continue',
						{
							method: 'POST',
							headers: getDropboxHeaders(),
							body: JSON.stringify({ cursor }),
						},
					)
					if (!continueResponse.ok) break
					const continueData: DropboxListFolderResponse =
						await continueResponse.json()
					allEntries = [...allEntries, ...continueData.entries]
					hasMore = continueData.has_more
					cursor = continueData.cursor
				}
				return allEntries
			}
		}
	}

	if (!response.ok) {
		const errorText = await response.text()
		let errorMessage = `Dropbox API error: ${response.status} ${response.statusText} - ${errorText}`

		if (response.status === 400 && errorText.includes('Invalid select user')) {
			errorMessage +=
				'\n\nHint: Invalid team member ID format. Expected format: "dbmid:xxxxx"'
		}

		if (response.status === 409) {
			try {
				const errorJson = JSON.parse(errorText)
				if (errorJson.error?.path?.['.tag'] === 'not_found') {
					errorMessage += `\n\nHint: Path not found: "${path}" (normalized: "${normalizedPath}")`
					if (env.DROPBOX_TEAM_MEMBER_ID && !env.DROPBOX_TEAM_NAMESPACE_ID) {
						errorMessage +=
							'\n\nIf this folder is in Dropbox Team space (not "My files"), set DROPBOX_TEAM_NAMESPACE_ID to your team root namespace and use the path as shown under Team space (e.g. /02 areas/...). Get namespace IDs with: POST https://api.dropboxapi.com/2/team/namespaces/list'
					} else if (pathRootUsed) {
						errorMessage +=
							'\n\nTeam namespace is set. Try folderPath with capital A: "/02 Areas/Epic Web/Epic TypeScript/test"'
						// List root of namespace to show what Dropbox actually has
						try {
							const rootRes = await fetch(
								'https://api.dropboxapi.com/2/files/list_folder',
								{
									method: 'POST',
									headers,
									body: JSON.stringify({
										path: '',
										recursive: false,
										include_media_info: false,
										include_deleted: false,
									}),
								},
							)
							if (rootRes.ok) {
								const rootData =
									(await rootRes.json()) as DropboxListFolderResponse
								const names = rootData.entries.map((e) => e.name).join(', ')
								errorMessage += `\n\nRoot of team folder contains: [${names}]. Use the exact name in your path.`
							}
						} catch {
							// ignore
						}
					}
				}
			} catch {
				// Ignore JSON parse errors
			}
		}

		throw new Error(errorMessage)
	}

	const data: DropboxListFolderResponse = await response.json()
	let allEntries = data.entries

	let hasMore = data.has_more
	let cursor = data.cursor

	while (hasMore) {
		const continueResponse = await fetch(
			'https://api.dropboxapi.com/2/files/list_folder/continue',
			{
				method: 'POST',
				headers: getDropboxHeaders(),
				body: JSON.stringify({ cursor }),
			},
		)

		if (!continueResponse.ok) {
			break
		}

		const continueData: DropboxListFolderResponse =
			await continueResponse.json()
		allEntries = [...allEntries, ...continueData.entries]
		hasMore = continueData.has_more
		cursor = continueData.cursor
	}

	return allEntries
}

async function getDropboxTemporaryLink(path: string): Promise<string> {
	const accessToken = env.DROPBOX_ACCESS_TOKEN

	if (!accessToken) {
		throw new Error('DROPBOX_ACCESS_TOKEN environment variable is not set')
	}

	const headers = getDropboxHeaders()
	const normalizedPath = normalizePathForNamespace(path)

	const response = await fetch(
		'https://api.dropboxapi.com/2/files/get_temporary_link',
		{
			method: 'POST',
			headers,
			body: JSON.stringify({ path: normalizedPath }),
		},
	)

	if (!response.ok) {
		const errorText = await response.text()
		throw new Error(
			`Dropbox API error getting temporary link: ${response.status} ${response.statusText} - ${errorText}`,
		)
	}

	const data: DropboxTemporaryLinkResponse = await response.json()
	return data.link
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function isVideoFile(fileName: string): boolean {
	const videoExtensions = ['.mp4', '.mov', '.avi', '.mkv', '.webm', '.m4v']
	const lowerName = fileName.toLowerCase()
	return videoExtensions.some((ext) => lowerName.endsWith(ext))
}

/**
 * Extracts a clean title from a filename or folder name
 * New naming pattern: "01_POLARIS_PROJECT_SETUP" → "Project Setup"
 * - Strip number prefix and underscore (01_)
 * - Strip "POLARIS_" prefix
 * - Convert remaining UPPER_SNAKE_CASE to Title Case
 */
function extractTitleFromName(name: string): string {
	// Remove video file extensions
	let title = name.replace(/\.(mp4|mov|avi|mkv|webm|m4v)$/i, '')

	// Remove number prefix (e.g., "01_")
	title = title.replace(/^\d+_/, '')

	// Remove "POLARIS_" prefix
	title = title.replace(/^POLARIS_/i, '')

	// Convert UPPER_SNAKE_CASE to Title Case
	title = title
		.split('_')
		.map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
		.join(' ')

	return title || name
}

/**
 * Extracts position/order from a filename or folder name
 * "01-intro.mp4" → 1
 * "01 - Getting Started" → 1
 */
function extractPositionFromName(name: string): number {
	const match = name.match(/^(\d+)/)
	return match && match[1] ? parseInt(match[1], 10) : 0
}

function extractWorkshopNameFromPath(folderPath: string): string {
	const segments = folderPath.split('/').filter(Boolean)
	const folderName = segments[segments.length - 1] || 'Untitled Workshop'
	return extractTitleFromName(folderName)
}

function slugify(text: string): string {
	return text
		.toLowerCase()
		.replace(/[^\w\s-]/g, '')
		.replace(/\s+/g, '-')
		.replace(/--+/g, '-')
		.trim()
}

// ============================================================================
// MAIN INNGEST FUNCTION
// ============================================================================

export const dropboxVideoImport = inngest.createFunction(
	{
		id: `dropbox-video-import`,
		name: 'Dropbox Video Import',
	},
	{
		event: DROPBOX_TO_COURSEBUILDER_MIGRATION_EVENT,
	},
	async ({ event, step, db: adapter }) => {
		if (!adapter) {
			throw new Error('Database adapter is not available')
		}

		const { folderPath, createdById, dryRun = false } = event.data

		if (!createdById && !dryRun) {
			throw new Error('createdById is required for import')
		}

		if (folderPath === undefined || folderPath === null) {
			throw new Error('folderPath is required')
		}

		console.log('[dropbox-import] Import started', { folderPath, dryRun })

		// ========================================================================
		// STEP 1: DISCOVER ROOT CONTENT
		// ========================================================================
		const rootEntries = await step.run(
			'Step 1: Discover root content',
			async () => {
				const entries = await listDropboxFolder(folderPath)

				const folders = entries
					.filter((e) => e['.tag'] === 'folder')
					.sort(
						(a, b) =>
							extractPositionFromName(a.name) - extractPositionFromName(b.name),
					)

				const videos = entries
					.filter((e) => e['.tag'] === 'file' && isVideoFile(e.name))
					.sort(
						(a, b) =>
							extractPositionFromName(a.name) - extractPositionFromName(b.name),
					)

				console.log('[dropbox-import] Root content discovered', {
					totalFolders: folders.length,
					totalRootVideos: videos.length,
					folders: folders.map((f) => f.name),
					videos: videos.map((v) => v.name),
				})

				return { folders, videos }
			},
		)

		const { videos: rootVideos } = rootEntries

		// ========================================================================
		// STEP 2: CREATE WORKSHOP
		// ========================================================================
		const workshopName = extractWorkshopNameFromPath(folderPath)
		const workshopGuid = guid()
		const workshopId = `workshop~${workshopGuid}`

		let workshop = null
		let actualWorkshopId: string | null = null

		if (!dryRun) {
			workshop = await step.run(
				`Step 2: Create workshop "${workshopName}"`,
				async () => {
					const workshopResource = await adapter.createContentResource({
						id: workshopId,
						type: 'workshop',
						fields: {
							title: workshopName,
							state: 'draft',
							visibility: 'unlisted',
							slug: `${slugify(workshopName)}~${workshopGuid}`,
						},
						createdById: createdById!,
					})

					actualWorkshopId = workshopResource.id

					console.log('[dropbox-import] Workshop created', {
						workshopId: workshopResource.id,
						workshopName,
					})

					return workshopResource
				},
			)

			if (workshop?.id) {
				actualWorkshopId = workshop.id
			}
		} else {
			console.log('[dropbox-import] Dry run - would create workshop', {
				workshopName,
				workshopId,
			})
			actualWorkshopId = workshopId
		}

		// ========================================================================
		// STEP 3: PROCESS ALL VIDEOS AS DIRECT LESSONS
		// ========================================================================
		const processedLessons: ProcessedVideo[] = []

		console.log('[dropbox-import] Processing all videos as lessons', {
			videoCount: rootVideos.length,
		})

		for (let i = 0; i < rootVideos.length; i++) {
			const video = rootVideos[i]
			if (!video) continue

			if (dryRun) {
				console.log('[dropbox-import] Dry run - would process video', {
					videoName: video.name,
				})
				continue
			}

			try {
				const result = await processVideo(
					video,
					actualWorkshopId!,
					createdById!,
					adapter,
					step,
				)
				if (result) {
					processedLessons.push(result)
				}
			} catch (error: any) {
				console.error('[dropbox-import] Video processing failed', {
					videoName: video.name,
					error: error?.message || String(error),
				})
			}
		}

		// ========================================================================
		// STEP 4: GENERATE REPORT
		// ========================================================================
		const report = await step.run('Step 4: Generate report', async () => {
			const report = {
				migratedAt: new Date().toISOString(),
				dryRun,
				folderPath,
				workshop: workshop
					? {
							id: workshop.id,
							name: workshopName,
							slug: `${slugify(workshopName)}~${workshopGuid}`,
						}
					: {
							wouldCreate: workshopName,
							wouldCreateId: workshopId,
						},
				summary: {
					totalVideos: rootVideos.length,
					lessonsProcessed: processedLessons.length,
					workshopCreated: workshop !== null,
					status: dryRun ? 'dry-run-complete' : 'import-complete',
				},
				lessons: dryRun
					? rootVideos.map((v) => ({
							name: v.name,
							path: v.path_display,
							position: extractPositionFromName(v.name),
						}))
					: processedLessons.map((p) => ({
							videoName: p.video.name,
							videoResourceId: p.videoResource?.id,
							lessonId: p.lesson?.id,
							lessonTitle: p.lesson?.fields?.title,
						})),
			}

			console.log('[dropbox-import] Report generated', report)

			return report
		})

		return report
	},
)

// ============================================================================
// HELPER: PROCESS A SINGLE VIDEO
// ============================================================================

async function processVideo(
	video: DropboxFile,
	workshopId: string,
	createdById: string,
	adapter: any,
	step: any,
): Promise<ProcessedVideo | null> {
	const videoName = video.name
	const lessonTitle = extractTitleFromName(videoName)

	console.log('[dropbox-import] Processing video', {
		videoName,
		lessonTitle,
	})

	// Get Dropbox download link
	const downloadLink = await step.run(
		`Get Dropbox link for "${videoName}"`,
		async () => {
			const link = await getDropboxTemporaryLink(video.path_lower)
			console.log('[dropbox-import] Got download link', { videoName })
			return link
		},
	)

	// Create MUX asset
	const videoResourceId = `video_${guid()}`
	const muxAsset = await step.run(
		`Create MUX asset for "${videoName}"`,
		async () => {
			console.log('[dropbox-import] Creating MUX asset', {
				videoName,
				videoResourceId,
			})

			const asset = await createMuxAsset({
				url: downloadLink,
				passthrough: videoResourceId,
			})

			console.log('[dropbox-import] MUX asset created', {
				videoName,
				muxAssetId: asset.id,
			})

			return asset
		},
	)

	const playbackId = muxAsset.playback_ids?.find(
		(p: any) => p.policy === 'public',
	)?.id

	if (!playbackId) {
		throw new Error(`No public playback ID found for MUX asset ${muxAsset.id}`)
	}

	// Create video resource
	const videoResource = await step.run(
		`Create video resource for "${videoName}"`,
		async () => {
			const resource = await adapter.createContentResource({
				id: videoResourceId,
				type: 'videoResource',
				fields: {
					state: 'processing',
					originalMediaUrl: downloadLink,
					muxAssetId: muxAsset.id,
					muxPlaybackId: playbackId,
					title: lessonTitle,
					dropboxPath: video.path_display,
				},
				createdById,
			})

			console.log('[dropbox-import] Video resource created', {
				videoResourceId: resource.id,
			})

			return resource
		},
	)

	// Trigger transcript generation
	await step.sendEvent(`Trigger transcript for "${videoName}"`, {
		name: VIDEO_RESOURCE_CREATED_EVENT,
		data: {
			videoResourceId: videoResource.id,
			originalMediaUrl: downloadLink,
		},
	})

	// Wait 30 seconds to avoid Deepgram rate limiting (429 errors)
	await step.sleep(`Wait after transcript trigger for "${videoName}"`, '30s')

	console.log('[dropbox-import] Waited 30s after transcript trigger', {
		videoName,
		videoResourceId: videoResource.id,
	})

	// Create lesson
	const lessonGuid = guid()
	const lessonId = `lesson_${lessonGuid}`

	const lessonFields: Record<string, any> = {
		title: lessonTitle,
		state: 'draft',
		visibility: 'unlisted',
		slug: `${slugify(lessonTitle)}~${lessonGuid}`,
		lessonType: 'lesson',
	}

	const lesson = await step.run(`Create lesson "${lessonTitle}"`, async () => {
		const lessonResource = await adapter.createContentResource({
			id: lessonId,
			type: 'lesson',
			fields: lessonFields,
			createdById,
		})

		// Link video to lesson
		await adapter.addResourceToResource({
			parentResourceId: lessonResource.id,
			childResourceId: videoResource.id,
		})

		console.log('[dropbox-import] Lesson created', {
			lessonId: lessonResource.id,
			lessonTitle,
		})

		return lessonResource
	})

	// Link lesson to workshop
	await step.run(`Link lesson to workshop`, async () => {
		if (!lesson?.id || !workshopId) {
			throw new Error('Lesson or workshop ID missing')
		}

		try {
			await adapter.addResourceToResource({
				parentResourceId: workshopId,
				childResourceId: lesson.id,
			})
		} catch (error: any) {
			if (
				error?.code === 'ER_DUP_ENTRY' ||
				error?.message?.includes('Duplicate entry') ||
				error?.message?.includes('UNIQUE constraint')
			) {
				console.log('[dropbox-import] Lesson already linked', {
					lessonId: lesson.id,
					workshopId,
				})
				return
			}
			throw error
		}

		console.log('[dropbox-import] Lesson linked to workshop', {
			lessonId: lesson.id,
			workshopId,
		})
	})

	console.log('[dropbox-import] Video processed successfully', {
		videoName,
		videoResourceId: videoResource?.id,
		lessonId: lesson?.id,
		lessonTitle,
	})

	return {
		video,
		muxAsset,
		videoResource,
		lesson,
	}
}
