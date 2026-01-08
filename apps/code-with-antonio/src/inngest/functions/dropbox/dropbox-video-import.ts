/**
 * ============================================================================
 * DROPBOX VIDEO IMPORT WORKFLOW
 * ============================================================================
 *
 * This Inngest function imports videos from Dropbox into CourseBuilder.
 * It creates a workshop, MUX assets, generates transcripts, and builds lessons.
 *
 * ============================================================================
 * NAMING CONVENTIONS (How names are generated):
 * ============================================================================
 *
 * WORKSHOP NAME = Dropbox folder name
 *    "/Workshops/React Fundamentals"  →  Workshop: "React Fundamentals"
 *    "/Courses/advanced-typescript"   →  Workshop: "Advanced Typescript"
 *
 * LESSON NAME = Video filename (cleaned up)
 *    "01-intro.mp4"                   →  Lesson: "Intro"
 *    "02_getting-started.mp4"         →  Lesson: "Getting Started"
 *    "03-building-your-first-app.mp4" →  Lesson: "Building Your First App"
 *    "advanced-hooks.mp4"             →  Lesson: "Advanced Hooks"
 *
 * LESSON ORDER = Number prefix in filename
 *    "01-intro.mp4"      →  Position 1
 *    "02-setup.mp4"      →  Position 2
 *    "10-advanced.mp4"   →  Position 10
 *    "intro.mp4"         →  Position 0 (no number)
 *
 * ============================================================================
 * WORKFLOW STEPS (What happens when you trigger this):
 * ============================================================================
 *
 * STEP 1: DISCOVER DROPBOX CONTENT
 *    - Lists all files and folders in the specified Dropbox path
 *    - Filters to only video files (.mp4, .mov, etc.)
 *    - Sorts videos by filename number prefix (01-intro, 02-setup, etc.)
 *
 * STEP 2: CREATE WORKSHOP FROM FOLDER NAME
 *    - Extracts the workshop name from the Dropbox folder path
 *    - Example: "/Workshops/React Fundamentals" → Workshop named "React Fundamentals"
 *    - Creates the workshop in the database
 *    - All lessons will be attached to this workshop
 *
 * STEP 3: FOR EACH VIDEO FILE:
 *
 *    STEP 3a: GET DROPBOX DOWNLOAD LINK
 *       - Calls Dropbox API to get a temporary download URL
 *       - This link is valid for 4 hours (plenty of time for MUX to fetch it)
 *
 *    STEP 3b: CREATE MUX ASSET
 *       - Sends the Dropbox URL to MUX
 *       - MUX downloads the video and starts processing
 *       - Returns a muxAssetId and muxPlaybackId
 *
 *    STEP 3c: CREATE VIDEO RESOURCE IN DATABASE
 *       - Creates a videoResource record with:
 *         - muxAssetId (for API calls)
 *         - muxPlaybackId (for the video player)
 *         - state: 'processing' (MUX will update to 'ready' via webhook)
 *
 *    STEP 3d: TRIGGER TRANSCRIPT GENERATION
 *       - Sends VIDEO_RESOURCE_CREATED_EVENT
 *       - This triggers Deepgram to generate a transcript
 *       - When done, transcript is saved to database
 *       - SRT captions are added to the MUX asset
 *
 *    STEP 3e: CREATE LESSON (name from video filename)
 *       - Creates a lesson resource linked to the video
 *       - Lesson title = video filename without numbers/extension
 *       - Example: "03-building-forms.mp4" → Lesson titled "Building Forms"
 *
 *    STEP 3f: LINK LESSON TO WORKSHOP
 *       - Attaches the lesson to the workshop created in Step 2
 *
 * STEP 4: GENERATE REPORT
 *    - Returns summary of what was created (workshop, lessons, videos)
 *
 * ============================================================================
 * WHAT HAPPENS AUTOMATICALLY AFTER THIS SCRIPT:
 * ============================================================================
 *
 * 1. MUX processes the video → sends webhook → video state updates to 'ready'
 * 2. Deepgram generates transcript → saves to database
 * 3. SRT captions are added to MUX asset
 *
 * ============================================================================
 * HOW TO TRIGGER:
 * ============================================================================
 *
 * POST /api/dropbox/migrate
 * {
 *   "folderPath": "/02 areas/Code with Antonio/video upload/test-script",  // Path relative to namespace root
 *   "videoFileName": "01-intro.mp4",                // Optional: single video only
 *   "createdById": "user_xyz789",                   // Required: your user ID
 *   "dryRun": false                                 // Set true to preview only
 * }
 *
 * NOTE: When using DROPBOX_TEAM_NAMESPACE_ID, the folderPath should be relative to
 *       the namespace root (e.g., "/02 areas/..." not "/_egghead-team/02 areas/...")
 *       The code will automatically strip "/_egghead-team" prefix if you include it.
 *
 * ============================================================================
 * ENVIRONMENT VARIABLES REQUIRED:
 * ============================================================================
 *
 * DROPBOX_ACCESS_TOKEN - Get from https://www.dropbox.com/developers/apps
 * DROPBOX_ROOT_FOLDER  - Optional default folder path
 * MUX_ACCESS_TOKEN_ID  - Already configured
 * MUX_SECRET_KEY       - Already configured
 * DEEPGRAM_API_KEY     - Already configured
 *
 * ============================================================================
 */

import { env } from '@/env.mjs'
import { inngest } from '@/inngest/inngest.server'
import { log } from '@/server/logger'
import { guid } from '@/utils/guid'

import { VIDEO_RESOURCE_CREATED_EVENT } from '@coursebuilder/core/inngest/video-processing/events/event-video-resource'
import { createMuxAsset } from '@coursebuilder/core/lib/mux'

import {
	DROPBOX_TO_COURSEBUILDER_MIGRATION_EVENT,
	type DropboxToCoursebuilderMigration,
} from '../../events/dropbox-migration'

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
// DROPBOX API FUNCTIONS
// ============================================================================

/**
 * Gets a team member's account ID from their email address
 * This is needed for the Dropbox-API-Select-User header
 */
async function getAccountIdFromEmail(email: string): Promise<string> {
	const headers: Record<string, string> = {
		Authorization: `Bearer ${env.DROPBOX_ACCESS_TOKEN}`,
		'Content-Type': 'application/json',
	}

	const response = await fetch(
		'https://api.dropboxapi.com/2/users/get_account',
		{
			method: 'POST',
			headers,
			body: JSON.stringify({ account_id: email }),
		},
	)

	if (!response.ok) {
		const errorText = await response.text()
		throw new Error(
			`Failed to get account ID for ${email}: ${response.status} ${errorText}`,
		)
	}

	const data = await response.json()
	return data.account_id
}

/**
 * Builds Dropbox API headers with optional team member selection
 * For Dropbox Business teams, we need to specify which team member's Dropbox to access
 *
 * The Dropbox-API-Select-User header requires an account ID (format: "dbid:xxxxx")
 * You can provide either:
 * - Account ID directly: "dbid:xxxxx" or just "xxxxx"
 * - Or it will be fetched from email if the value looks like an email
 */
function getDropboxHeaders(): Record<string, string> {
	const headers: Record<string, string> = {
		Authorization: `Bearer ${env.DROPBOX_ACCESS_TOKEN}`,
		'Content-Type': 'application/json',
	}

	// Add team member selection header if provided (required for Dropbox Business)
	if (env.DROPBOX_TEAM_MEMBER_ID) {
		let teamMemberId = env.DROPBOX_TEAM_MEMBER_ID.trim()

		// Dropbox-API-Select-User accepts team_member_id in format "dbmid:xxxxx"
		// It can also accept account_id in format "dbid:xxxxx", but team_member_id is preferred
		// Keep the prefix if present (dbmid: or dbid:), otherwise assume it's already the ID part
		if (
			!teamMemberId.startsWith('dbmid:') &&
			!teamMemberId.startsWith('dbid:')
		) {
			// If no prefix, assume it's a team_member_id and add dbmid: prefix
			teamMemberId = `dbmid:${teamMemberId}`
		}

		// Remove any extra whitespace
		teamMemberId = teamMemberId.trim()

		headers['Dropbox-API-Select-User'] = teamMemberId
	}

	// Add team namespace header if provided (required for accessing team folders)
	if (env.DROPBOX_TEAM_NAMESPACE_ID) {
		// Dropbox-API-Path-Root header format: JSON string with namespace_id
		const pathRoot = JSON.stringify({
			'.tag': 'namespace_id',
			namespace_id: env.DROPBOX_TEAM_NAMESPACE_ID.trim(),
		})
		headers['Dropbox-API-Path-Root'] = pathRoot
	}

	return headers
}

/**
 * Normalizes a Dropbox path when using team namespace
 * When Dropbox-API-Path-Root is set to a namespace, paths should be relative to that namespace
 * So if path is "/_egghead-team/..." and we're using the _egghead-team namespace, strip the prefix
 *
 * @param path - The Dropbox folder path
 * @returns Normalized path relative to the namespace root
 */
function normalizePathForNamespace(path: string): string {
	// If we're using a team namespace, paths should be relative to that namespace root
	if (env.DROPBOX_TEAM_NAMESPACE_ID) {
		// Strip leading "/_egghead-team" if present (since namespace root is already _egghead-team)
		if (path.startsWith('/_egghead-team')) {
			path = path.substring('/_egghead-team'.length)
			// If path is now empty, it means we're at the namespace root
			if (!path || path === '/') {
				return ''
			}
		}
		// Ensure path starts with / if it's not empty
		if (path && !path.startsWith('/')) {
			path = '/' + path
		}
	}

	// Handle root path
	if (path === '/') {
		return ''
	}

	return path
}

/**
 * Lists all files and folders in a Dropbox folder
 * Handles pagination automatically for large folders
 *
 * @param path - The Dropbox folder path (e.g., '/Workshops' or '' for root)
 * @returns Array of files and folders
 */
async function listDropboxFolder(path: string): Promise<DropboxFile[]> {
	const accessToken = env.DROPBOX_ACCESS_TOKEN

	if (!accessToken) {
		throw new Error('DROPBOX_ACCESS_TOKEN environment variable is not set')
	}

	const headers = getDropboxHeaders()

	// Normalize path for namespace (strip _egghead-team prefix if using namespace)
	const normalizedPath = normalizePathForNamespace(path)

	// Log the header value for debugging
	if (headers['Dropbox-API-Select-User']) {
		await log.info('dropbox-api-call', {
			step: 'list-folder',
			originalPath: path,
			normalizedPath,
			selectUserHeader: headers['Dropbox-API-Select-User'],
			hasPathRoot: !!headers['Dropbox-API-Path-Root'],
		})
	}

	const response = await fetch(
		'https://api.dropboxapi.com/2/files/list_folder',
		{
			method: 'POST',
			headers,
			body: JSON.stringify({
				path: normalizedPath,
				recursive: false,
				include_media_info: true,
				include_deleted: false,
			}),
		},
	)

	if (!response.ok) {
		const errorText = await response.text()
		let errorMessage = `Dropbox API error: ${response.status} ${response.statusText} - ${errorText}`

		// Add helpful hints for common errors
		if (response.status === 400) {
			try {
				const errorJson = JSON.parse(errorText)
				// Check for invalid select user format
				if (errorText.includes('Invalid select user id format')) {
					const currentValue = env.DROPBOX_TEAM_MEMBER_ID || 'not set'
					errorMessage +=
						`\n\n💡 Invalid team member ID format!\n` +
						`   - Current value: "${currentValue}"\n` +
						`   - Expected format: "dbmid:xxxxx" (team_member_id from team/members/list)\n` +
						`   - OR: "dbid:xxxxx" (account_id, but team_member_id is preferred)\n` +
						`   - Make sure you're using team_member_id, not account_id\n` +
						`   - Get the correct ID from the browser script output (look for "team_member_id")`
				}
				// Check for team token error
				else if (
					errorText.includes('Dropbox Business team') ||
					errorText.includes('select_user')
				) {
					errorMessage +=
						`\n\n💡 Team token detected! You need to set DROPBOX_TEAM_MEMBER_ID\n` +
						`   - The value should be team_member_id (format: "dbmid:xxxxx")\n` +
						`   - Get it by running the browser script: get-dropbox-account-id-browser-simple.js\n` +
						`   - Look for "team_member_id" in the output, not "account_id"\n` +
						`   - Or use the account_id from a file's metadata\n` +
						`   - Example: DROPBOX_TEAM_MEMBER_ID=dbid:AACxxxxxxxxxxxxx`
				}
			} catch {
				// If parsing fails, use original error
			}
		}

		if (response.status === 409) {
			try {
				const errorJson = JSON.parse(errorText)
				if (
					errorJson.error?.['.tag'] === 'path' &&
					errorJson.error?.path?.['.tag'] === 'not_found'
				) {
					const normalizedPath = normalizePathForNamespace(path)
					errorMessage +=
						`\n\n💡 Path not found: "${path}"\n` +
						`   - Normalized path (with namespace): "${normalizedPath}"\n` +
						`   - When using DROPBOX_TEAM_NAMESPACE_ID, paths are relative to the namespace root\n` +
						`   - If path starts with "/_egghead-team", that prefix is automatically stripped\n` +
						`   - Check if the path is correct after normalization\n` +
						`   - Make sure the access token has permission to access this folder\n` +
						`   - For shared folders, the token owner must have access\n` +
						`   - Try listing root folder first: "" (empty string)`
				}
			} catch {
				// If parsing fails, use original error
			}
		}

		throw new Error(errorMessage)
	}

	const data: DropboxListFolderResponse = await response.json()
	let allEntries = data.entries

	// Handle pagination for large folders
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

/**
 * Gets a temporary direct download link for a Dropbox file
 * This link is valid for 4 hours - MUX uses it to fetch the video
 *
 * @param path - The Dropbox file path (e.g., '/Workshops/video.mp4')
 * @returns Temporary download URL that MUX can use
 */
async function getDropboxTemporaryLink(path: string): Promise<string> {
	const accessToken = env.DROPBOX_ACCESS_TOKEN

	if (!accessToken) {
		throw new Error('DROPBOX_ACCESS_TOKEN environment variable is not set')
	}

	const headers = getDropboxHeaders()

	// Normalize path for namespace (strip _egghead-team prefix if using namespace)
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

/**
 * Checks if a file is a video based on extension
 */
function isVideoFile(fileName: string): boolean {
	const videoExtensions = ['.mp4', '.mov', '.avi', '.mkv', '.webm', '.m4v']
	const lowerName = fileName.toLowerCase()
	return videoExtensions.some((ext) => lowerName.endsWith(ext))
}

/**
 * Extracts a clean lesson title from a video filename
 *
 * This is how LESSON NAMES are generated:
 *   "01-intro.mp4"                   → "Intro"
 *   "02_setup-guide.mp4"             → "Setup Guide"
 *   "03-building-your-first-app.mp4" → "Building Your First App"
 *   "advanced-hooks.mp4"             → "Advanced Hooks"
 *
 * Steps:
 *   1. Remove file extension (.mp4, .mov, etc.)
 *   2. Remove leading numbers and separators (01-, 02_, etc.)
 *   3. Replace dashes/underscores with spaces
 *   4. Capitalize each word
 *
 * @param fileName - The video filename (e.g., "01-intro.mp4")
 * @returns Clean title for the lesson (e.g., "Intro")
 */
function extractTitleFromFileName(fileName: string): string {
	let title = fileName.replace(/\.[^/.]+$/, '') // Remove extension
	title = title.replace(/^\d+[-_.\s]*/, '') // Remove leading numbers
	title = title.replace(/[-_]/g, ' ') // Replace separators with spaces
	title = title
		.split(' ')
		.map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
		.join(' ')
	return title || fileName
}

/**
 * Extracts position/order from a video filename
 * "01-intro.mp4" -> 1
 * "02_setup.mp4" -> 2
 * "intro.mp4" -> 0
 */
function extractPositionFromFileName(fileName: string): number {
	const match = fileName.match(/^(\d+)[-_.\s]/)
	return match && match[1] ? parseInt(match[1], 10) : 0
}

/**
 * Extracts the workshop name from a Dropbox folder path
 * "/Workshops/React Fundamentals" -> "React Fundamentals"
 * "/My Videos/Advanced TypeScript" -> "Advanced TypeScript"
 * "react-course" -> "React Course"
 */
function extractWorkshopNameFromPath(folderPath: string): string {
	// Get the last segment of the path (the folder name)
	const segments = folderPath.split('/').filter(Boolean)
	const folderName = segments[segments.length - 1] || 'Untitled Workshop'

	// Clean up the name: replace separators with spaces, capitalize words
	let workshopName = folderName.replace(/[-_]/g, ' ')
	workshopName = workshopName
		.split(' ')
		.map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
		.join(' ')

	return workshopName
}

/**
 * Creates a URL-friendly slug from a string
 * "React Fundamentals" -> "react-fundamentals"
 */
function slugify(text: string): string {
	return text
		.toLowerCase()
		.replace(/[^\w\s-]/g, '') // Remove special characters
		.replace(/\s+/g, '-') // Replace spaces with hyphens
		.replace(/--+/g, '-') // Replace multiple hyphens with single
		.trim()
}

// ============================================================================
// MAIN INNGEST FUNCTION
// ============================================================================

/**
 * Main Inngest function that orchestrates the Dropbox to CourseBuilder import
 */
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

		const {
			folderPath,
			videoFileName,
			createdById,
			dryRun = false,
		} = event.data

		// Validate required fields
		if (!createdById && !dryRun) {
			throw new Error('createdById is required for import')
		}

		// Allow empty string for root folder (for testing), but require it to be provided
		if (folderPath === undefined || folderPath === null) {
			throw new Error(
				'folderPath is required - it will be used as the workshop name (use "" for root folder)',
			)
		}

		await log.info('dropbox-import', {
			step: 'import-started',
			folderPath,
			videoFileName: videoFileName || 'all',
			dryRun,
		})

		// ========================================================================
		// STEP 1: DISCOVER DROPBOX CONTENT
		// ========================================================================
		const rootPath = folderPath
		const allEntries = await step.run(
			'Step 1: Discover Dropbox content',
			async () => {
				await log.info('dropbox-import', {
					step: 'discover-content',
					rootPath,
				})

				const entries = await listDropboxFolder(rootPath)

				await log.info('dropbox-import', {
					step: 'content-discovered',
					totalEntries: entries.length,
					folders: entries
						.filter((e) => e['.tag'] === 'folder')
						.map((e) => e.name),
					videos: entries
						.filter((e) => e['.tag'] === 'file' && isVideoFile(e.name))
						.map((e) => e.name),
				})

				return entries
			},
		)

		// Filter to video files only, sorted by position
		const videoFiles = allEntries
			.filter((entry) => entry['.tag'] === 'file' && isVideoFile(entry.name))
			.sort(
				(a, b) =>
					extractPositionFromFileName(a.name) -
					extractPositionFromFileName(b.name),
			)

		await log.info('dropbox-import', {
			step: 'videos-filtered',
			totalVideos: videoFiles.length,
			videos: videoFiles.map((v) => ({
				name: v.name,
				path: v.path_display,
				position: extractPositionFromFileName(v.name),
			})),
		})

		// If specific video requested, filter to just that one
		let videosToProcess = videoFiles
		if (videoFileName) {
			videosToProcess = videoFiles.filter(
				(v) => v.name.toLowerCase() === videoFileName.toLowerCase(),
			)
			if (videosToProcess.length === 0) {
				throw new Error(`Video "${videoFileName}" not found in ${rootPath}`)
			}
		}

		// Log all videos that will be processed
		await step.run('Step 1b: Log videos to process', async () => {
			await log.info('dropbox-import', {
				step: 'videos-to-process',
				totalVideosFound: videoFiles.length,
				totalVideosToProcess: videosToProcess.length,
				videoFileName: videoFileName || 'all',
				videoNames: videosToProcess.map((v, idx) => ({
					index: idx + 1,
					name: v.name,
					path: v.path_display,
					position: extractPositionFromFileName(v.name),
				})),
			})
			return {
				totalVideosFound: videoFiles.length,
				totalVideosToProcess: videosToProcess.length,
				videos: videosToProcess.map((v) => v.name),
			}
		})

		// ========================================================================
		// STEP 2: CREATE WORKSHOP FROM FOLDER NAME
		// ========================================================================
		const workshopName = extractWorkshopNameFromPath(folderPath)
		const workshopGuid = guid()
		const workshopId = `workshop_${workshopGuid}`

		let workshop = null
		let actualWorkshopId: string | null = null // Store the actual ID from the created workshop

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

					// Store the actual ID from the created resource
					actualWorkshopId = workshopResource.id

					await log.info('dropbox-import', {
						step: 'workshop-created',
						generatedWorkshopId: workshopId,
						actualWorkshopId: workshopResource.id,
						workshopName,
						slug: `${slugify(workshopName)}~${workshopGuid}`,
					})

					return workshopResource
				},
			)

			// Ensure we have the actual ID even if workshop was created in a step
			if (workshop?.id) {
				actualWorkshopId = workshop.id
			}
		} else {
			await log.info('dropbox-import', {
				step: 'dry-run-skip-workshop',
				workshopName,
				wouldCreateId: workshopId,
			})
			// In dry run, use the generated ID
			actualWorkshopId = workshopId
		}

		// ========================================================================
		// STEP 3: PROCESS EACH VIDEO
		// ========================================================================
		const processedVideos: Array<{
			video: DropboxFile
			muxAsset: any
			videoResource: any
			lesson: any
		}> = []

		await log.info('dropbox-import', {
			step: 'starting-video-processing',
			totalVideosToProcess: videosToProcess.length,
			videoNames: videosToProcess.map((v) => v.name),
		})

		for (let i = 0; i < videosToProcess.length; i++) {
			const video = videosToProcess[i]

			if (!video) {
				await log.warn('dropbox-import', {
					step: 'video-undefined',
					videoIndex: i + 1,
					totalVideos: videosToProcess.length,
				})
				continue
			}

			await log.info('dropbox-import', {
				step: 'processing-video',
				videoIndex: i + 1,
				totalVideos: videosToProcess.length,
				videoName: video.name,
				videoPath: video.path_display,
			})
			// Skip actual processing in dry run mode
			if (dryRun) {
				await log.info('dropbox-import', {
					step: 'dry-run-skip-video',
					videoName: video.name,
					videoPath: video.path_display,
				})
				continue
			}

			// Wrap each video's processing in try-catch so failures don't stop the entire migration
			try {
				// ====================================================================
				// STEP 3a: GET DROPBOX DOWNLOAD LINK
				// ====================================================================
				const downloadLink = await step.run(
					`Step 3a: Get Dropbox link for "${video.name}"`,
					async () => {
						const link = await getDropboxTemporaryLink(video.path_lower)

						await log.info('dropbox-import', {
							step: 'got-download-link',
							videoName: video.name,
							linkLength: link.length, // Don't log full link for security
						})

						return link
					},
				)

				// ====================================================================
				// STEP 3b: CREATE MUX ASSET
				// ====================================================================
				const videoResourceId = `video_${guid()}`
				const muxAsset = await step.run(
					`Step 3b: Create MUX asset for "${video.name}"`,
					async () => {
						await log.info('dropbox-import', {
							step: 'creating-mux-asset',
							videoName: video.name,
							videoResourceId,
						})

						// MUX will fetch the video from the Dropbox URL
						const asset = await createMuxAsset({
							url: downloadLink,
							passthrough: videoResourceId,
						})

						await log.info('dropbox-import', {
							step: 'mux-asset-created',
							videoName: video.name,
							muxAssetId: asset.id,
							playbackIds: asset.playback_ids?.map((p: any) => p.id),
						})

						return asset
					},
				)

				// Get the public playback ID
				const playbackId = muxAsset.playback_ids?.find(
					(p: any) => p.policy === 'public',
				)?.id

				if (!playbackId) {
					throw new Error(
						`No public playback ID found for MUX asset ${muxAsset.id}`,
					)
				}

				// ====================================================================
				// STEP 3c: CREATE VIDEO RESOURCE IN DATABASE
				// ====================================================================
				const videoResource = await step.run(
					`Step 3c: Create video resource for "${video.name}"`,
					async () => {
						const resource = await adapter.createContentResource({
							id: videoResourceId,
							type: 'videoResource',
							fields: {
								state: 'processing', // MUX webhook will update to 'ready'
								originalMediaUrl: downloadLink,
								muxAssetId: muxAsset.id,
								muxPlaybackId: playbackId,
								title: extractTitleFromFileName(video.name),
								dropboxPath: video.path_display, // For reference
							},
							createdById: createdById!,
						})

						await log.info('dropbox-import', {
							step: 'video-resource-created',
							videoResourceId: resource.id,
							muxPlaybackId: playbackId,
							title: extractTitleFromFileName(video.name),
						})

						return resource
					},
				)

				// ====================================================================
				// STEP 3d: TRIGGER TRANSCRIPT GENERATION
				// ====================================================================
				await step.sendEvent(
					`Step 3d: Trigger transcript for "${video.name}"`,
					{
						name: VIDEO_RESOURCE_CREATED_EVENT,
						data: {
							videoResourceId: videoResource.id,
							originalMediaUrl: downloadLink,
						},
					},
				)

				await log.info('dropbox-import', {
					step: 'transcript-event-sent',
					videoResourceId: videoResource.id,
				})

				// ====================================================================
				// STEP 3e: CREATE LESSON (name from video filename)
				// Example: "03-building-forms.mp4" → Lesson titled "Building Forms"
				// ====================================================================
				const lessonGuid = guid()
				const lessonId = `lesson_${lessonGuid}`
				// Lesson title is extracted from video filename (see extractTitleFromFileName)
				const lessonTitle = extractTitleFromFileName(video.name)
				// Position is extracted from the number prefix (01-, 02-, etc.)
				const position = extractPositionFromFileName(video.name)

				const lesson = await step.run(
					`Step 3e: Create lesson "${lessonTitle}" from "${video.name}"`,
					async () => {
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

						// Link video resource to lesson
						// Use the actual lessonResource.id from the created resource
						if (!videoResource?.id) {
							throw new Error(
								`Video resource ID is missing for "${video.name}"`,
							)
						}
						if (!lessonResource?.id) {
							throw new Error(
								`Lesson resource was not created successfully for "${video.name}"`,
							)
						}

						await adapter.addResourceToResource({
							parentResourceId: lessonResource.id,
							childResourceId: videoResource.id,
						})

						await log.info('dropbox-import', {
							step: 'lesson-created',
							lessonId,
							lessonTitle,
							videoResourceId: videoResource.id,
						})

						return lessonResource
					},
				)

				// ====================================================================
				// STEP 3f: LINK LESSON TO WORKSHOP
				// ====================================================================
				await step.run(
					`Step 3f: Link lesson to workshop "${workshopName}"`,
					async () => {
						// Use the actual lesson.id from the created resource (like bunny migration does)
						if (!lesson?.id) {
							throw new Error(
								`Lesson was not created successfully for video "${video.name}". Expected ID: ${lessonId}`,
							)
						}
						if (!actualWorkshopId) {
							throw new Error(
								`Workshop ID is missing for workshop "${workshopName}". Workshop may not have been created.`,
							)
						}

						const linkOptions = {
							parentResourceId: actualWorkshopId,
							childResourceId: lesson.id,
						}

						await log.info('dropbox-import', {
							step: 'about-to-link-lesson-to-workshop',
							linkOptions,
							workshopId: actualWorkshopId,
							lessonId: lesson.id,
							generatedLessonId: lessonId,
							adapterExists: !!adapter,
							adapterMethodExists: !!adapter?.addResourceToResource,
						})

						if (!adapter?.addResourceToResource) {
							throw new Error(
								'Database adapter or addResourceToResource method is not available',
							)
						}

						let resourceJoin
						try {
							resourceJoin = await adapter.addResourceToResource(linkOptions)
						} catch (error: any) {
							// Check if it's a duplicate key error (relationship already exists)
							if (
								error?.code === 'ER_DUP_ENTRY' ||
								error?.message?.includes('Duplicate entry') ||
								error?.message?.includes('UNIQUE constraint')
							) {
								await log.info('dropbox-import', {
									step: 'lesson-already-linked-to-workshop',
									lessonId: lesson.id,
									workshopId: actualWorkshopId,
									message: 'Relationship already exists, skipping',
								})
								// Relationship already exists, which is fine - continue
								return
							}
							// Re-throw if it's a different error
							throw error
						}

						await log.info('dropbox-import', {
							step: 'lesson-linked-to-workshop',
							lessonId: lesson.id,
							workshopId: actualWorkshopId,
							workshopName,
							position,
							resourceId: resourceJoin?.resourceId,
							resourceOfId: resourceJoin?.resourceOfId,
							hasResource: !!resourceJoin?.resource,
							result: resourceJoin ? 'success' : 'null',
						})

						if (!resourceJoin) {
							// If resourceJoin is null, the relationship might already exist
							// Try to verify by checking if we can continue without error
							await log.warn('dropbox-import', {
								step: 'lesson-link-returned-null',
								lessonId: lesson.id,
								workshopId: actualWorkshopId,
								message:
									'addResourceToResource returned null, but relationship may already exist',
							})
							// Don't throw - the relationship might already exist and that's okay
						}
					},
				)

				processedVideos.push({
					video,
					muxAsset,
					videoResource,
					lesson,
				})

				await log.info('dropbox-import', {
					step: 'video-processed-successfully',
					videoName: video.name,
					videoResourceId: videoResource?.id,
					lessonId: lesson?.id,
				})
			} catch (error: any) {
				// Log the error but continue processing other videos
				await log.error('dropbox-import', {
					step: 'video-processing-failed',
					videoName: video.name,
					videoPath: video.path_display,
					error: error?.message || String(error),
					errorStack: error?.stack,
					message:
						'Failed to process this video, but continuing with remaining videos',
				})

				// Continue to next video instead of stopping the entire migration
				continue
			}
		}

		// ========================================================================
		// STEP 4: GENERATE REPORT
		// ========================================================================
		const report = await step.run('Step 4: Generate report', async () => {
			const report = {
				migratedAt: new Date().toISOString(),
				dryRun,
				folderPath: rootPath,
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
					totalFolders: allEntries.filter((e) => e['.tag'] === 'folder').length,
					totalVideos: videoFiles.length,
					videosProcessed: processedVideos.length,
					workshopCreated: workshop !== null,
					status: dryRun ? 'dry-run-complete' : 'import-complete',
				},
				processedVideos: processedVideos.map((p) => ({
					videoName: p.video.name,
					videoResourceId: p.videoResource?.id,
					muxPlaybackId: p.muxAsset?.playback_ids?.[0]?.id,
					lessonId: p.lesson?.id,
				})),
				allVideosFound: videoFiles.map((v) => ({
					name: v.name,
					path: v.path_display,
					position: extractPositionFromFileName(v.name),
				})),
			}

			await log.info('dropbox-import', {
				step: 'report-generated',
				report: JSON.stringify(report, null, 2),
			})

			return report
		})

		return report
		// return null
	},
)
