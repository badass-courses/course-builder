#!/usr/bin/env tsx
/**
 * Script to batch generate transcripts for all video resources in a workshop
 *
 * Usage:
 *   tsx scripts/generate-workshop-transcripts.ts <workshop-id>
 *
 * This script will:
 * 1. Get the workshop by ID
 * 2. Find all video resources within the workshop
 * 3. Check if SRT is empty for each video resource
 * 4. Trigger transcript generation with rate limiting (45 seconds between requests)
 *
 * Rate limiting is important to avoid 429 errors from Deepgram API
 */
import { courseBuilderAdapter, db } from '@/db'
import { contentResource, contentResourceResource } from '@/db/schema'
import { inngest } from '@/inngest/inngest.server'
import { and, eq, or, sql } from 'drizzle-orm'

import { VIDEO_RESOURCE_CREATED_EVENT } from '@coursebuilder/core/inngest/video-processing/events/event-video-resource'

/**
 * Get all video resources for a workshop
 * This handles the hierarchy: workshop -> sections -> lessons -> video resources
 */
async function getWorkshopVideoResources(
	workshopId: string,
): Promise<string[]> {
	// First, verify the workshop exists
	const workshop = await db.query.contentResource.findFirst({
		where: and(
			or(
				eq(contentResource.id, workshopId),
				sql`JSON_EXTRACT(${contentResource.fields}, "$.slug") = ${workshopId}`,
			),
			eq(contentResource.type, 'workshop'),
		),
	})

	if (!workshop) {
		throw new Error(`Workshop with ID ${workshopId} not found`)
	}

	// Query to find all video resources in the workshop
	// This handles:
	// 1. Direct lessons in workshop -> video resources
	// 2. Lessons in sections in workshop -> video resources
	const query = sql`
		SELECT DISTINCT cr_video.id AS videoResourceId
		FROM ${contentResource} AS cr_workshop
		
		-- Direct lessons in workshop
		LEFT JOIN ${contentResourceResource} AS crr_lesson ON cr_workshop.id = crr_lesson.resourceOfId
		LEFT JOIN ${contentResource} AS cr_lesson ON crr_lesson.resourceId = cr_lesson.id
		
		-- Lessons in sections
		LEFT JOIN ${contentResourceResource} AS crr_section ON cr_workshop.id = crr_section.resourceOfId
		LEFT JOIN ${contentResource} AS cr_section ON crr_section.resourceId = cr_section.id AND cr_section.type = 'section'
		LEFT JOIN ${contentResourceResource} AS crr_section_lesson ON cr_section.id = crr_section_lesson.resourceOfId
		LEFT JOIN ${contentResource} AS cr_section_lesson ON crr_section_lesson.resourceId = cr_section_lesson.id
		
		-- Video resources linked to lessons
		LEFT JOIN ${contentResourceResource} AS crr_video1 ON cr_lesson.id = crr_video1.resourceOfId
		LEFT JOIN ${contentResource} AS cr_video1 ON crr_video1.resourceId = cr_video1.id AND cr_video1.type = 'videoResource'
		
		LEFT JOIN ${contentResourceResource} AS crr_video2 ON cr_section_lesson.id = crr_video2.resourceOfId
		LEFT JOIN ${contentResource} AS cr_video2 ON crr_video2.resourceId = cr_video2.id AND cr_video2.type = 'videoResource'
		
		WHERE (cr_workshop.id = ${workshopId} OR JSON_EXTRACT(cr_workshop.fields, "$.slug") = ${workshopId})
			AND cr_workshop.type = 'workshop'
			AND (
				cr_video1.id IS NOT NULL
				OR cr_video2.id IS NOT NULL
			)
	`

	const result = await db.execute(query)
	const videoResourceIds = result.rows
		.map((row: any) => row.videoResourceId as string)
		.filter((id: string | null) => id !== null)

	return videoResourceIds
}

/**
 * Check if a video resource has an empty or missing SRT
 */
async function hasEmptySrt(videoResourceId: string): Promise<boolean> {
	const videoResource =
		await courseBuilderAdapter.getVideoResource(videoResourceId)

	if (!videoResource) {
		console.warn(`Video resource ${videoResourceId} not found`)
		return false
	}

	// Check if SRT is empty, null, or undefined
	const srt = videoResource.srt
	return !srt || srt.trim().length === 0
}

/**
 * Trigger transcript generation for a video resource
 * This mimics what the "Add Transcript" button does
 */
async function triggerTranscriptGeneration(
	videoResourceId: string,
): Promise<void> {
	const videoResource =
		await courseBuilderAdapter.getVideoResource(videoResourceId)

	if (!videoResource?.id) {
		throw new Error(`Video resource ${videoResourceId} not found`)
	}

	if (!videoResource.muxPlaybackId) {
		throw new Error(
			`Video resource ${videoResourceId} does not have a muxPlaybackId`,
		)
	}

	// Send the Inngest event to trigger transcript generation
	// This is the same event that reprocessTranscript sends
	await inngest.send({
		name: VIDEO_RESOURCE_CREATED_EVENT,
		data: {
			videoResourceId: videoResource.id,
			originalMediaUrl: `https://stream.mux.com/${videoResource.muxPlaybackId}/low.mp4?download=${videoResource.id}`,
		},
		// Note: user is optional for server-side scripts
	})
}

/**
 * Sleep for a specified number of milliseconds
 */
function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Main function to process workshop transcripts
 */
async function main() {
	const workshopId = process.argv[2]

	if (!workshopId) {
		console.error(
			'Usage: tsx scripts/generate-workshop-transcripts.ts <workshop-id>',
		)
		process.exit(1)
	}

	console.log(
		`\n🎬 Starting transcript generation for workshop: ${workshopId}\n`,
	)

	try {
		// Get all video resource IDs in the workshop
		console.log('📋 Finding all video resources in workshop...')
		const videoResourceIds = await getWorkshopVideoResources(workshopId)

		if (videoResourceIds.length === 0) {
			console.log('✅ No video resources found in this workshop')
			return
		}

		console.log(`📹 Found ${videoResourceIds.length} video resource(s)\n`)

		// Filter to only those with empty SRT
		console.log('🔍 Checking which video resources need transcripts...')
		const needsTranscript: string[] = []

		for (const videoResourceId of videoResourceIds) {
			const isEmpty = await hasEmptySrt(videoResourceId)
			if (isEmpty) {
				needsTranscript.push(videoResourceId)
				console.log(`  ⚠️  Video ${videoResourceId} needs transcript`)
			} else {
				console.log(`  ✅ Video ${videoResourceId} already has transcript`)
			}
		}

		if (needsTranscript.length === 0) {
			console.log('\n✅ All video resources already have transcripts!')
			return
		}

		console.log(
			`\n📝 Found ${needsTranscript.length} video resource(s) that need transcripts\n`,
		)

		// Process each video resource with rate limiting
		const delayMs = 45 * 1000 // 45 seconds between requests
		let processed = 0
		let failed = 0

		for (let i = 0; i < needsTranscript.length; i++) {
			const videoResourceId = needsTranscript[i]
			const videoResource =
				await courseBuilderAdapter.getVideoResource(videoResourceId)
			const title = videoResource?.title || videoResourceId

			console.log(
				`\n[${i + 1}/${needsTranscript.length}] Processing: ${title} (${videoResourceId})`,
			)

			try {
				await triggerTranscriptGeneration(videoResourceId)
				processed++
				console.log(`  ✅ Successfully triggered transcript generation`)

				// Wait before processing the next one (except for the last one)
				if (i < needsTranscript.length - 1) {
					console.log(
						`  ⏳ Waiting ${delayMs / 1000} seconds before next request...`,
					)
					await sleep(delayMs)
				}
			} catch (error) {
				failed++
				console.error(`  ❌ Failed to trigger transcript generation:`, error)

				// Even on error, wait before the next request to avoid rate limits
				if (i < needsTranscript.length - 1) {
					console.log(
						`  ⏳ Waiting ${delayMs / 1000} seconds before next request...`,
					)
					await sleep(delayMs)
				}
			}
		}

		console.log(`\n\n📊 Summary:`)
		console.log(`  ✅ Successfully triggered: ${processed}`)
		console.log(`  ❌ Failed: ${failed}`)
		console.log(`  📹 Total processed: ${needsTranscript.length}`)
		console.log(
			`\n💡 Note: Transcript generation is asynchronous. Check the Inngest dashboard or video resources to see when transcripts are ready.`,
		)
	} catch (error) {
		console.error('\n❌ Error:', error)
		process.exit(1)
	}
}

main().catch((error) => {
	console.error('Fatal error:', error)
	process.exit(1)
})
