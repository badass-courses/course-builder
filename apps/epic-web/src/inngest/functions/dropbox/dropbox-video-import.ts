/**
 * ============================================================================
 * DROPBOX VIDEO IMPORT WORKFLOW
 * ============================================================================
 *
 * This Inngest function imports videos from Dropbox into CourseBuilder.
 * It creates a workshop with sections, MUX assets, generates transcripts,
 * and builds lessons organized into sections.
 *
 * ============================================================================
 * EXPECTED FOLDER STRUCTURE:
 * ============================================================================
 *
 * /Workshop Folder/
 *   ├── 00-intro.mp4              (root-level videos → direct lessons in workshop)
 *   ├── 01-welcome.mp4
 *   ├── 01 - Section Name/        (folders → sections, sorted by number prefix)
 *   │   ├── 01-lesson.mp4         (videos → lessons in section)
 *   │   └── 02-lesson.mp4
 *   ├── 02 - Another Section/
 *   │   ├── 01-lesson.mp4
 *   │   └── ...
 *   └── ...
 *
 * ============================================================================
 * NAMING CONVENTIONS:
 * ============================================================================
 *
 * WORKSHOP NAME = Root folder name
 *    "/Workshops/React Fundamentals"  →  Workshop: "React Fundamentals"
 *
 * SECTION NAME = Subfolder name (cleaned up)
 *    "01 - Getting Started"  →  Section: "Getting Started"
 *    "02_Advanced-Topics"    →  Section: "Advanced Topics"
 *
 * LESSON NAME = Video filename (cleaned up)
 *    "01-intro.mp4"  →  Lesson: "Intro"
 *
 * ORDER = Number prefix in filename/folder name
 *    "01-intro.mp4"        →  Position 1
 *    "01 - Getting Started" →  Position 1
 *
 * ============================================================================
 * WORKFLOW:
 * ============================================================================
 *
 * 1. Discover Dropbox content (root level)
 * 2. Create workshop from folder name
 * 3. Process root-level videos as direct lessons in workshop
 * 4. For each subfolder (section):
 *    - Create section resource
 *    - List videos in section folder
 *    - Process videos as lessons
 *    - Link lessons to section
 *    - Link section to workshop
 * 5. Generate report
 *
 * ============================================================================
 * HOW TO TRIGGER:
 * ============================================================================
 *
 * POST /api/dropbox/migrate
 * {
 *   "folderPath": "/Workshops/React Fundamentals",
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
// RESULT TYPES
// ============================================================================

interface ProcessedVideo {
	video: DropboxFile
	muxAsset: any
	videoResource: any
	lesson: any
	sectionId?: string
}

interface ProcessedSection {
	folder: DropboxFile
	section: any
	lessons: ProcessedVideo[]
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
 * Checks if a video is a problem exercise
 * Matches various patterns:
 * - "01.problem.hello-world.mp4" (dots)
 * - "01-problem-hello-world.mp4" (dashes)
 * - "01_problem_hello-world.mp4" (underscores)
 * - "01 problem hello-world.mp4" (spaces)
 */
function isProblemVideo(fileName: string): boolean {
	const lowerName = fileName.toLowerCase()
	// Match "problem" surrounded by separators (., -, _, space) or at start/end
	return (
		/[.\-_\s]problem[.\-_\s]/i.test(lowerName) ||
		lowerName.startsWith('problem.') ||
		lowerName.startsWith('problem-') ||
		lowerName.startsWith('problem_')
	)
}

/**
 * Checks if a video is a solution
 * Matches various patterns:
 * - "01.solution.hello-world.mp4" (dots)
 * - "01-solution-hello-world.mp4" (dashes)
 * - "01_solution_hello-world.mp4" (underscores)
 * - "01 solution hello-world.mp4" (spaces)
 */
function isSolutionVideo(fileName: string): boolean {
	const lowerName = fileName.toLowerCase()
	// Match "solution" surrounded by separators (., -, _, space) or at start/end
	return (
		/[.\-_\s]solution[.\-_\s]/i.test(lowerName) ||
		lowerName.startsWith('solution.') ||
		lowerName.startsWith('solution-') ||
		lowerName.startsWith('solution_')
	)
}

/**
 * Checks if a video is an intro video
 * "00.intro.mp4" or "00-intro.mp4" → true
 */
function isIntroVideo(fileName: string): boolean {
	const lowerName = fileName.toLowerCase()
	return (
		lowerName.includes('intro') &&
		!lowerName.includes('.problem.') &&
		!lowerName.includes('.solution.')
	)
}

/**
 * Checks if a video is an outro video
 * "99.outro.mp4" or "99-outro.mp4" → true
 */
function isOutroVideo(fileName: string): boolean {
	const lowerName = fileName.toLowerCase()
	return (
		lowerName.includes('outro') &&
		!lowerName.includes('.problem.') &&
		!lowerName.includes('.solution.')
	)
}

/**
 * Checks if a video is a break video (section outro)
 * "99.break.mp4" or "99-break.mp4" → true
 */
function isBreakVideo(fileName: string): boolean {
	const lowerName = fileName.toLowerCase()
	return (
		lowerName.includes('break') &&
		!lowerName.includes('.problem.') &&
		!lowerName.includes('.solution.')
	)
}

/**
 * Extracts a clean title from a filename or folder name
 * "00.intro.mp4" → "Intro"
 * "01.problem.hello-world.mp4" → "Hello World"
 * "01.solution.hello-world.mp4" → "Hello World"
 * "01-programming-foundations" → "Programming Foundations"
 * "01.section-first" → "Section First"
 */
function extractTitleFromName(name: string): string {
	// Remove only video file extensions (not arbitrary dots)
	let title = name.replace(/\.(mp4|mov|avi|mkv|webm|m4v)$/i, '')

	// Handle problem/solution pattern: "01.problem.hello-world" or "01.solution.hello-world"
	const problemMatch = title.match(/^\d+\.problem\.(.+)$/i)
	const solutionMatch = title.match(/^\d+\.solution\.(.+)$/i)

	if (problemMatch && problemMatch[1]) {
		title = problemMatch[1]
	} else if (solutionMatch && solutionMatch[1]) {
		title = solutionMatch[1]
	} else {
		// Standard pattern: remove leading numbers and any combination of separators
		// Handles: "01.section-first", "01-section", "01_section", "01 section", "01 - section"
		title = title.replace(/^\d+[\s._-]*/, '')
	}

	// Replace dashes, underscores, dots with spaces
	title = title.replace(/[-_.]/g, ' ')
	title = title
		.split(' ')
		.filter(Boolean)
		.map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
		.join(' ')
	return title || name
}

/**
 * Creates a lesson title from video name, adding parent context only for intro/outro
 *
 * "00.intro.mp4" + "01-programming-foundations" → "Intro to Programming Foundations"
 * "00.outro.mp4" + "01-programming-foundations" → "Outro to Programming Foundations"
 * "01.variables.mp4" + "01-programming-foundations" → "Variables"
 * "01.problem.hello-world.mp4" + "..." → "Hello World"
 * "01.solution.hello-world.mp4" + "..." → "Hello World"
 */
function createLessonTitle(videoName: string, parentName: string): string {
	const videoTitle = extractTitleFromName(videoName)
	const lowerVideoName = videoName.toLowerCase()

	// Only append parent name for intro/outro videos (not for problem/solution)
	if (
		(lowerVideoName.includes('intro') || lowerVideoName.includes('outro')) &&
		!isProblemVideo(videoName) &&
		!isSolutionVideo(videoName)
	) {
		const parentTitle = extractTitleFromName(parentName)
		return `${videoTitle} to ${parentTitle}`
	}

	return videoTitle
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

		const { folders: sectionFolders, videos: rootVideos } = rootEntries

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
		// STEP 3: CREATE INTRO SECTION AND PROCESS INTRO VIDEOS
		// ========================================================================
		// Separate intro videos from outro videos - intro goes first, outro goes last
		const introVideos = rootVideos.filter((v) => isIntroVideo(v.name))
		const outroVideos = rootVideos.filter((v) => isOutroVideo(v.name))
		const otherRootVideos = rootVideos.filter(
			(v) => !isIntroVideo(v.name) && !isOutroVideo(v.name),
		)

		const processedRootVideos: ProcessedVideo[] = []
		let introSection: any = null

		console.log('[dropbox-import] Processing intro videos', {
			introCount: introVideos.length,
			outroCount: outroVideos.length,
			otherCount: otherRootVideos.length,
		})

		// Create intro section if there are intro videos
		if (introVideos.length > 0 && !dryRun) {
			const introSectionName = `Introduction to ${workshopName}`
			const introSectionGuid = guid()
			const introSectionId = `section~${introSectionGuid}`

			introSection = await step.run(
				`Step 3a: Create intro section "${introSectionName}"`,
				async () => {
					const sectionResource = await adapter.createContentResource({
						id: introSectionId,
						type: 'section',
						fields: {
							title: introSectionName,
							state: 'draft',
							visibility: 'unlisted',
							slug: `${slugify(introSectionName)}~${introSectionGuid}`,
						},
						createdById: createdById!,
					})

					console.log('[dropbox-import] Intro section created', {
						sectionId: sectionResource.id,
						sectionName: introSectionName,
					})

					return sectionResource
				},
			)

			// Link intro section to workshop
			await step.run(`Step 3b: Link intro section to workshop`, async () => {
				if (!introSection?.id || !actualWorkshopId) {
					throw new Error('Intro section or workshop ID missing')
				}

				try {
					await adapter.addResourceToResource({
						parentResourceId: actualWorkshopId,
						childResourceId: introSection.id,
					})
				} catch (error: any) {
					if (
						error?.code === 'ER_DUP_ENTRY' ||
						error?.message?.includes('Duplicate entry') ||
						error?.message?.includes('UNIQUE constraint')
					) {
						console.log('[dropbox-import] Intro section already linked')
						return
					}
					throw error
				}

				console.log('[dropbox-import] Intro section linked to workshop')
			})
		}

		// Process intro videos into intro section
		for (let i = 0; i < introVideos.length; i++) {
			const video = introVideos[i]
			if (!video) continue

			if (dryRun) {
				console.log('[dropbox-import] Dry run - would process intro video', {
					videoName: video.name,
				})
				continue
			}

			try {
				const introSectionName = `Introduction to ${workshopName}`

				const result = await processVideo(
					video,
					actualWorkshopId!,
					introSection?.id || null, // Attach to intro section
					introSectionName,
					createdById!,
					adapter,
					step,
				)
				if (result) {
					processedRootVideos.push(result)
				}
			} catch (error: any) {
				console.error('[dropbox-import] Intro video processing failed', {
					videoName: video.name,
					error: error?.message || String(error),
				})
			}
		}

		// Process other root videos (non-intro, non-outro) - attach directly to workshop
		for (let i = 0; i < otherRootVideos.length; i++) {
			const video = otherRootVideos[i]
			if (!video) continue

			if (dryRun) {
				console.log('[dropbox-import] Dry run - would process root video', {
					videoName: video.name,
				})
				continue
			}

			try {
				const workshopFolderName =
					folderPath.split('/').filter(Boolean).pop() || 'Workshop'
				const cleanedWorkshopName = extractTitleFromName(workshopFolderName)

				const result = await processVideo(
					video,
					actualWorkshopId!,
					null,
					cleanedWorkshopName,
					createdById!,
					adapter,
					step,
				)
				if (result) {
					processedRootVideos.push(result)
				}
			} catch (error: any) {
				console.error('[dropbox-import] Root video processing failed', {
					videoName: video.name,
					error: error?.message || String(error),
				})
			}
		}

		// ========================================================================
		// STEP 4: PROCESS SECTIONS (SUBFOLDERS)
		// ========================================================================
		const processedSections: ProcessedSection[] = []

		console.log('[dropbox-import] Processing sections', {
			count: sectionFolders.length,
		})

		for (let i = 0; i < sectionFolders.length; i++) {
			const folder = sectionFolders[i]
			if (!folder) continue

			const sectionName = extractTitleFromName(folder.name)
			const sectionGuid = guid()
			const sectionId = `section~${sectionGuid}`

			console.log('[dropbox-import] Processing section', {
				sectionIndex: i + 1,
				totalSections: sectionFolders.length,
				sectionName,
				folderPath: folder.path_display,
			})

			// List videos in this section folder
			const sectionVideos = await step.run(
				`Step 4a: List videos in section "${sectionName}"`,
				async () => {
					const entries = await listDropboxFolder(folder.path_lower)
					return entries
						.filter((e) => e['.tag'] === 'file' && isVideoFile(e.name))
						.sort(
							(a, b) =>
								extractPositionFromName(a.name) -
								extractPositionFromName(b.name),
						)
				},
			)

			if (dryRun) {
				console.log('[dropbox-import] Dry run - would create section', {
					sectionName,
					sectionId,
					videoCount: sectionVideos.length,
					videos: sectionVideos.map((v) => v.name),
				})
				continue
			}

			// Create section resource
			const section = await step.run(
				`Step 4b: Create section "${sectionName}"`,
				async () => {
					const sectionResource = await adapter.createContentResource({
						id: sectionId,
						type: 'section',
						fields: {
							title: sectionName,
							state: 'draft',
							visibility: 'unlisted',
							slug: `${slugify(sectionName)}~${sectionGuid}`,
						},
						createdById: createdById!,
					})

					console.log('[dropbox-import] Section created', {
						sectionId: sectionResource.id,
						sectionName,
					})

					return sectionResource
				},
			)

			// Link section to workshop
			await step.run(
				`Step 4c: Link section "${sectionName}" to workshop`,
				async () => {
					if (!section?.id || !actualWorkshopId) {
						throw new Error('Section or workshop ID missing')
					}

					try {
						await adapter.addResourceToResource({
							parentResourceId: actualWorkshopId,
							childResourceId: section.id,
						})
					} catch (error: any) {
						if (
							error?.code === 'ER_DUP_ENTRY' ||
							error?.message?.includes('Duplicate entry') ||
							error?.message?.includes('UNIQUE constraint')
						) {
							console.log('[dropbox-import] Section already linked', {
								sectionId: section.id,
								workshopId: actualWorkshopId,
							})
							return
						}
						throw error
					}

					console.log('[dropbox-import] Section linked to workshop', {
						sectionId: section.id,
						workshopId: actualWorkshopId,
					})
				},
			)

			// Separate videos into regular lessons, problems, solutions, and breaks
			// Break videos (like "99.break.mp4") should be processed last to be positioned at end of section
			const regularVideos = sectionVideos.filter(
				(v) =>
					!isProblemVideo(v.name) &&
					!isSolutionVideo(v.name) &&
					!isBreakVideo(v.name),
			)
			const problemVideos = sectionVideos.filter((v) => isProblemVideo(v.name))
			const solutionVideos = sectionVideos.filter((v) =>
				isSolutionVideo(v.name),
			)
			const breakVideos = sectionVideos.filter((v) => isBreakVideo(v.name))

			console.log('[dropbox-import] Section video breakdown', {
				sectionName,
				regular: regularVideos.length,
				problems: problemVideos.length,
				solutions: solutionVideos.length,
				breaks: breakVideos.length,
			})

			const sectionLessons: ProcessedVideo[] = []
			const problemLessonsMap: Map<number, ProcessedVideo> = new Map() // Map position -> processed problem

			// Extract section number from folder name for exercisePath (e.g., "01. Section Name" → 1)
			const currentSectionNumber = extractPositionFromName(folder.name)

			// First pass: Process regular lessons (attach to section)
			for (const video of regularVideos) {
				if (!video) continue

				try {
					const result = await processVideo(
						video,
						actualWorkshopId!,
						section.id,
						sectionName, // Use cleaned section name for lesson titles
						createdById!,
						adapter,
						step,
						currentSectionNumber,
					)
					if (result) {
						sectionLessons.push(result)
					}
				} catch (error: any) {
					console.error('[dropbox-import] Regular video processing failed', {
						sectionName,
						videoName: video.name,
						error: error?.message || String(error),
					})
				}
			}

			// Second pass: Process problem videos (attach to section)
			for (const video of problemVideos) {
				if (!video) continue

				try {
					const result = await processVideo(
						video,
						actualWorkshopId!,
						section.id,
						sectionName, // Use cleaned section name for lesson titles
						createdById!,
						adapter,
						step,
						currentSectionNumber,
					)
					if (result) {
						sectionLessons.push(result)
						// Store problem by position for solution linking
						const position = extractPositionFromName(video.name)
						problemLessonsMap.set(position, result)
					}
				} catch (error: any) {
					console.error('[dropbox-import] Problem video processing failed', {
						sectionName,
						videoName: video.name,
						error: error?.message || String(error),
					})
				}
			}

			// Third pass: Process solution videos (attach to matching problem, not section)
			for (const video of solutionVideos) {
				if (!video) continue

				const solutionPosition = extractPositionFromName(video.name)
				const matchingProblem = problemLessonsMap.get(solutionPosition)

				if (!matchingProblem) {
					console.warn('[dropbox-import] No matching problem for solution', {
						sectionName,
						videoName: video.name,
						position: solutionPosition,
						availableProblems: Array.from(problemLessonsMap.keys()),
					})
					// Fall back to attaching to section if no matching problem
					try {
						const result = await processVideo(
							video,
							actualWorkshopId!,
							section.id,
							sectionName, // Use cleaned section name
							createdById!,
							adapter,
							step,
							currentSectionNumber,
						)
						if (result) {
							sectionLessons.push(result)
						}
					} catch (error: any) {
						console.error(
							'[dropbox-import] Solution video processing failed (fallback)',
							{
								videoName: video.name,
								error: error?.message || String(error),
							},
						)
					}
					continue
				}

				try {
					// Process solution and attach to the problem lesson (not section)
					const result = await processSolutionVideo(
						video,
						matchingProblem.lesson.id, // Attach to the problem lesson
						sectionName, // Use cleaned section name
						createdById!,
						adapter,
						step,
					)
					if (result) {
						sectionLessons.push(result)
						console.log('[dropbox-import] Solution attached to problem', {
							solutionVideo: video.name,
							problemLessonId: matchingProblem.lesson.id,
							position: solutionPosition,
						})
					}
				} catch (error: any) {
					console.error('[dropbox-import] Solution video processing failed', {
						sectionName,
						videoName: video.name,
						error: error?.message || String(error),
					})
				}
			}

			// Fourth pass: Process break videos LAST (to position them at end of section)
			for (const video of breakVideos) {
				if (!video) continue

				try {
					const result = await processVideo(
						video,
						actualWorkshopId!,
						section.id,
						sectionName,
						createdById!,
						adapter,
						step,
						currentSectionNumber,
					)
					if (result) {
						sectionLessons.push(result)
					}
				} catch (error: any) {
					console.error('[dropbox-import] Break video processing failed', {
						sectionName,
						videoName: video.name,
						error: error?.message || String(error),
					})
				}
			}

			processedSections.push({
				folder,
				section,
				lessons: sectionLessons,
			})

			console.log('[dropbox-import] Section completed', {
				sectionName,
				lessonsProcessed: sectionLessons.length,
			})
		}

		// ========================================================================
		// STEP 5: CREATE OUTRO SECTION AND PROCESS OUTRO VIDEOS
		// ========================================================================
		const processedOutroVideos: ProcessedVideo[] = []
		let outroSection: any = null

		console.log('[dropbox-import] Processing outro videos', {
			count: outroVideos.length,
		})

		// Create outro section if there are outro videos
		if (outroVideos.length > 0 && !dryRun) {
			const outroSectionName = `Outro to ${workshopName}`
			const outroSectionGuid = guid()
			const outroSectionId = `section~${outroSectionGuid}`

			outroSection = await step.run(
				`Step 5a: Create outro section "${outroSectionName}"`,
				async () => {
					const sectionResource = await adapter.createContentResource({
						id: outroSectionId,
						type: 'section',
						fields: {
							title: outroSectionName,
							state: 'draft',
							visibility: 'unlisted',
							slug: `${slugify(outroSectionName)}~${outroSectionGuid}`,
						},
						createdById: createdById!,
					})

					console.log('[dropbox-import] Outro section created', {
						sectionId: sectionResource.id,
						sectionName: outroSectionName,
					})

					return sectionResource
				},
			)

			// Link outro section to workshop (at the end)
			await step.run(`Step 5b: Link outro section to workshop`, async () => {
				if (!outroSection?.id || !actualWorkshopId) {
					throw new Error('Outro section or workshop ID missing')
				}

				try {
					await adapter.addResourceToResource({
						parentResourceId: actualWorkshopId,
						childResourceId: outroSection.id,
					})
				} catch (error: any) {
					if (
						error?.code === 'ER_DUP_ENTRY' ||
						error?.message?.includes('Duplicate entry') ||
						error?.message?.includes('UNIQUE constraint')
					) {
						console.log('[dropbox-import] Outro section already linked')
						return
					}
					throw error
				}

				console.log('[dropbox-import] Outro section linked to workshop')
			})
		}

		// Process outro videos into outro section
		for (let i = 0; i < outroVideos.length; i++) {
			const video = outroVideos[i]
			if (!video) continue

			if (dryRun) {
				console.log('[dropbox-import] Dry run - would process outro video', {
					videoName: video.name,
				})
				continue
			}

			try {
				const outroSectionName = `Outro to ${workshopName}`

				const result = await processVideo(
					video,
					actualWorkshopId!,
					outroSection?.id || null, // Attach to outro section
					outroSectionName,
					createdById!,
					adapter,
					step,
				)
				if (result) {
					processedOutroVideos.push(result)
					processedRootVideos.push(result) // Also add to root videos for report
				}
			} catch (error: any) {
				console.error('[dropbox-import] Outro video processing failed', {
					videoName: video.name,
					error: error?.message || String(error),
				})
			}
		}

		// ========================================================================
		// STEP 6: GENERATE REPORT
		// ========================================================================
		const report = await step.run('Step 6: Generate report', async () => {
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
					totalSections: sectionFolders.length,
					sectionsProcessed: processedSections.length,
					totalRootVideos: rootVideos.length,
					rootVideosProcessed: processedRootVideos.length,
					totalSectionVideos: processedSections.reduce(
						(acc, s) => acc + s.lessons.length,
						0,
					),
					workshopCreated: workshop !== null,
					status: dryRun ? 'dry-run-complete' : 'import-complete',
				},
				rootVideos: dryRun
					? rootVideos.map((v) => ({
							name: v.name,
							path: v.path_display,
							position: extractPositionFromName(v.name),
						}))
					: processedRootVideos.map((p) => ({
							videoName: p.video.name,
							videoResourceId: p.videoResource?.id,
							lessonId: p.lesson?.id,
						})),
				sections: dryRun
					? sectionFolders.map((f) => ({
							name: extractTitleFromName(f.name),
							path: f.path_display,
							position: extractPositionFromName(f.name),
						}))
					: processedSections.map((s) => ({
							sectionId: s.section?.id,
							sectionName: extractTitleFromName(s.folder.name),
							sectionNumber: extractPositionFromName(s.folder.name),
							lessons: s.lessons.map((l) => ({
								videoName: l.video.name,
								videoResourceId: l.videoResource?.id,
								lessonId: l.lesson?.id,
								exercisePath: l.lesson?.fields?.exercisePath || null,
								isProblem: isProblemVideo(l.video.name),
							})),
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
	sectionId: string | null,
	parentName: string, // The folder name (workshop or section) for title generation
	createdById: string,
	adapter: any,
	step: any,
	sectionNumber?: number, // Section number for exercisePath (from folder name like "01. Section")
): Promise<ProcessedVideo | null> {
	const videoName = video.name

	console.log('[dropbox-import] Processing video', {
		videoName,
		sectionId: sectionId || 'root',
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
					title: extractTitleFromName(videoName),
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
	const lessonTitle = createLessonTitle(videoName, parentName)

	// Build lesson fields
	const lessonPosition = extractPositionFromName(video.name)
	const isProblem = isProblemVideo(video.name)

	console.log('[dropbox-import] Checking if problem video', {
		videoName: video.name,
		isProblem,
		sectionNumber,
		lessonPosition,
	})

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

	// Create and attach exercise for problem videos
	if (isProblem && sectionNumber !== undefined && lesson?.id) {
		const paddedSection = String(sectionNumber).padStart(2, '0')
		const paddedLesson = String(lessonPosition).padStart(2, '0')
		const exercisePath = `/${paddedSection}/${paddedLesson}/problem`

		await step.run(`Create exercise for problem "${lessonTitle}"`, async () => {
			const exerciseGuid = guid()
			const exerciseId = `exercise_${exerciseGuid}`

			// Create exercise resource
			const exerciseResource = await adapter.createContentResource({
				id: exerciseId,
				type: 'exercise',
				fields: {
					workshopApp: {
						path: exercisePath,
					},
				},
				createdById,
			})

			// Link exercise to lesson
			await adapter.addResourceToResource({
				parentResourceId: lesson.id,
				childResourceId: exerciseResource.id,
			})

			console.log('[dropbox-import] ✅ Exercise created and attached', {
				exerciseId: exerciseResource.id,
				lessonId: lesson.id,
				exercisePath,
			})

			return exerciseResource
		})
	}

	// Link lesson to section (if section exists) or workshop (if root video)
	const parentId = sectionId || workshopId
	const parentType = sectionId ? 'section' : 'workshop'

	await step.run(`Link lesson to ${parentType}`, async () => {
		if (!lesson?.id || !parentId) {
			throw new Error(`Lesson or ${parentType} ID missing`)
		}

		try {
			await adapter.addResourceToResource({
				parentResourceId: parentId,
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
					parentId,
				})
				return
			}
			throw error
		}

		console.log('[dropbox-import] Lesson linked', {
			lessonId: lesson.id,
			parentId,
			parentType,
		})
	})

	console.log('[dropbox-import] Video processed successfully', {
		videoName,
		videoResourceId: videoResource?.id,
		lessonId: lesson?.id,
	})

	return {
		video,
		muxAsset,
		videoResource,
		lesson,
		sectionId: sectionId || undefined,
	}
}

// ============================================================================
// HELPER: PROCESS A SOLUTION VIDEO (ATTACH TO PROBLEM)
// ============================================================================

async function processSolutionVideo(
	video: DropboxFile,
	problemLessonId: string, // The problem lesson to attach this solution to
	parentName: string,
	createdById: string,
	adapter: any,
	step: any,
): Promise<ProcessedVideo | null> {
	const videoName = video.name

	console.log('[dropbox-import] Processing solution video', {
		videoName,
		problemLessonId,
	})

	// Get Dropbox download link
	const downloadLink = await step.run(
		`Get Dropbox link for solution "${videoName}"`,
		async () => {
			const link = await getDropboxTemporaryLink(video.path_lower)
			console.log('[dropbox-import] Got download link for solution', {
				videoName,
			})
			return link
		},
	)

	// Create MUX asset
	const videoResourceId = `video_${guid()}`
	const muxAsset = await step.run(
		`Create MUX asset for solution "${videoName}"`,
		async () => {
			console.log('[dropbox-import] Creating MUX asset for solution', {
				videoName,
				videoResourceId,
			})

			const asset = await createMuxAsset({
				url: downloadLink,
				passthrough: videoResourceId,
			})

			console.log('[dropbox-import] MUX asset created for solution', {
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
		`Create video resource for solution "${videoName}"`,
		async () => {
			const resource = await adapter.createContentResource({
				id: videoResourceId,
				type: 'videoResource',
				fields: {
					state: 'processing',
					originalMediaUrl: downloadLink,
					muxAssetId: muxAsset.id,
					muxPlaybackId: playbackId,
					title: extractTitleFromName(videoName),
					dropboxPath: video.path_display,
				},
				createdById,
			})

			console.log('[dropbox-import] Video resource created for solution', {
				videoResourceId: resource.id,
			})

			return resource
		},
	)

	// Trigger transcript generation
	await step.sendEvent(`Trigger transcript for solution "${videoName}"`, {
		name: VIDEO_RESOURCE_CREATED_EVENT,
		data: {
			videoResourceId: videoResource.id,
			originalMediaUrl: downloadLink,
		},
	})

	// Wait 30 seconds to avoid Deepgram rate limiting (429 errors)
	await step.sleep(
		`Wait after transcript trigger for solution "${videoName}"`,
		'30s',
	)

	console.log('[dropbox-import] Waited 30s after solution transcript trigger', {
		videoName,
		videoResourceId: videoResource.id,
	})

	// Create solution lesson
	const lessonGuid = guid()
	const lessonId = `solution_${lessonGuid}`
	const lessonTitle = createLessonTitle(videoName, parentName)

	const lesson = await step.run(
		`Create solution "${lessonTitle}"`,
		async () => {
			const lessonResource = await adapter.createContentResource({
				id: lessonId,
				type: 'solution',
				fields: {
					title: lessonTitle,
					state: 'draft',
					visibility: 'unlisted',
					slug: `${slugify(lessonTitle)}~${lessonGuid}`,
				},
				createdById,
			})

			// Link video to solution
			await adapter.addResourceToResource({
				parentResourceId: lessonResource.id,
				childResourceId: videoResource.id,
			})

			console.log('[dropbox-import] Solution created', {
				solutionId: lessonResource.id,
				lessonTitle,
			})

			return lessonResource
		},
	)

	// Link solution to problem lesson (not to section)
	await step.run(`Link solution to problem`, async () => {
		if (!lesson?.id || !problemLessonId) {
			throw new Error('Solution or problem lesson ID missing')
		}

		try {
			await adapter.addResourceToResource({
				parentResourceId: problemLessonId,
				childResourceId: lesson.id,
			})
		} catch (error: any) {
			if (
				error?.code === 'ER_DUP_ENTRY' ||
				error?.message?.includes('Duplicate entry') ||
				error?.message?.includes('UNIQUE constraint')
			) {
				console.log('[dropbox-import] Solution already linked to problem', {
					solutionId: lesson.id,
					problemLessonId,
				})
				return
			}
			throw error
		}

		console.log('[dropbox-import] Solution linked to problem', {
			solutionId: lesson.id,
			problemLessonId,
		})
	})

	console.log('[dropbox-import] Solution video processed successfully', {
		videoName,
		videoResourceId: videoResource?.id,
		solutionId: lesson?.id,
		problemLessonId,
	})

	return {
		video,
		muxAsset,
		videoResource,
		lesson,
		sectionId: undefined,
	}
}
