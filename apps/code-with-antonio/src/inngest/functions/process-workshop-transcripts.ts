import { courseBuilderAdapter, db } from '@/db'
import {
	contentResource,
	contentResourceResource,
	contentResourceTag as contentResourceTagTable,
} from '@/db/schema'
import { inngest } from '@/inngest/inngest.server'
import { getVideoResourceForLesson } from '@/lib/lessons-query'
import { WorkshopSchema } from '@/lib/workshops'
import { getWorkshop } from '@/lib/workshops-query'
import { log } from '@/server/logger'
import { and, asc, eq, or, sql } from 'drizzle-orm'

import { VIDEO_RESOURCE_CREATED_EVENT } from '@coursebuilder/core/inngest/video-processing/events/event-video-resource'

import { PROCESS_WORKSHOP_TRANSCRIPTS_EVENT } from '../events/workshop-transcript-processing'

/**
 * Recursively collect all lesson IDs from a workshop
 * @param workshop - The workshop resource
 * @returns Array of lesson IDs
 */
function collectLessonIds(workshop: any): string[] {
	const lessonIds: string[] = []

	function traverse(resources: any[]) {
		if (!resources) return

		for (const mapping of resources) {
			const resource = mapping.resource
			if (resource) {
				// If it's a lesson, add it
				if (resource.type === 'lesson') {
					lessonIds.push(resource.id)
				}

				// Recurse into nested resources (sections contain lessons)
				if (resource.resources && Array.isArray(resource.resources)) {
					traverse(resource.resources)
				}
			}
		}
	}

	if (workshop.resources) {
		traverse(workshop.resources)
	}

	return lessonIds
}

export const processWorkshopTranscripts = inngest.createFunction(
	{
		id: 'process-workshop-transcripts',
		name: 'Process Workshop Transcripts',
	},
	{
		event: PROCESS_WORKSHOP_TRANSCRIPTS_EVENT,
	},
	async ({ event, step }) => {
		const { workshopId, delaySeconds: rawDelaySeconds } = event.data
		const delaySeconds =
			typeof rawDelaySeconds === 'string'
				? parseInt(rawDelaySeconds, 10)
				: (rawDelaySeconds ?? 45)

		if (!workshopId) {
			throw new Error(
				'workshopId is required in event data. Received: ' +
					JSON.stringify(event.data),
			)
		}

		await log.info('workshop.transcript.batch.started', {
			workshopId,
			delaySeconds,
		})

		// Step 1: Get the workshop and collect lesson IDs
		// Combine these steps to minimize step output size - only return lesson IDs
		const { lessonIds, workshopId: validatedWorkshopId } = await step.run(
			'get workshop and collect lesson ids',
			async () => {
				let workshop
				// Try getWorkshop first (with auth), fallback to direct query if auth fails
				try {
					workshop = await getWorkshop(workshopId)
				} catch (error) {
					// If auth fails, query directly without visibility restrictions
					await log.warn('workshop.transcript.batch.auth-fallback', {
						workshopId,
						error: error instanceof Error ? error.message : String(error),
					})

					const workshopData = await db.query.contentResource.findFirst({
						where: and(
							eq(contentResource.id, workshopId),
							eq(contentResource.type, 'workshop'),
						),
						with: {
							tags: {
								with: {
									tag: true,
								},
								orderBy: asc(contentResourceTagTable.position),
							},
							resources: {
								with: {
									resource: {
										with: {
											resources: {
												with: {
													resource: true,
												},
												orderBy: asc(contentResourceResource.position),
											},
										},
									},
								},
								orderBy: asc(contentResourceResource.position),
							},
						},
					})

					if (!workshopData) {
						return { lessonIds: [], workshopId: null }
					}

					const parsed = WorkshopSchema.safeParse(workshopData)
					workshop = parsed.success ? parsed.data : null
				}

				if (!workshop) {
					await log.error('workshop.transcript.batch.workshop-not-found', {
						workshopId,
					})
					return { lessonIds: [], workshopId: null }
				}

				const lessonIds = collectLessonIds(workshop)
				return { lessonIds, workshopId: workshop.id }
			},
		)

		if (!validatedWorkshopId) {
			throw new Error(`Workshop not found: ${workshopId}`)
		}

		await log.info('workshop.transcript.batch.lessons-found', {
			workshopId: validatedWorkshopId,
			lessonCount: lessonIds.length,
		})

		if (lessonIds.length === 0) {
			await log.info('workshop.transcript.batch.no-lessons', {
				workshopId: validatedWorkshopId,
			})
			return {
				workshopId: validatedWorkshopId,
				totalLessons: 0,
				lessonsWithTranscripts: 0,
				lessonsWithoutTranscripts: 0,
				processed: 0,
				errors: 0,
			}
		}

		// Step 3: Find which lessons are missing transcripts
		const lessonsToProcess = await step.run(
			'check lessons for missing transcripts',
			async () => {
				const results = []

				for (const lessonId of lessonIds) {
					const videoResource = await getVideoResourceForLesson(lessonId)

					if (!videoResource) {
						// Lesson has no video resource, skip
						continue
					}

					// Check if transcript (SRT) exists
					const hasTranscript = Boolean(
						videoResource.srt && videoResource.srt.trim().length > 0,
					)

					if (!hasTranscript) {
						results.push({
							lessonId,
							videoResourceId: videoResource.id,
							muxPlaybackId: videoResource.muxPlaybackId,
						})
					}
				}

				return results
			},
		)

		const lessonsWithTranscripts = lessonIds.length - lessonsToProcess.length

		await log.info('workshop.transcript.batch.analysis', {
			workshopId: validatedWorkshopId,
			totalLessons: lessonIds.length,
			lessonsWithTranscripts,
			lessonsWithoutTranscripts: lessonsToProcess.length,
		})

		if (lessonsToProcess.length === 0) {
			await log.info('workshop.transcript.batch.all-complete', {
				workshopId: validatedWorkshopId,
			})
			return {
				workshopId: validatedWorkshopId,
				totalLessons: lessonIds.length,
				lessonsWithTranscripts,
				lessonsWithoutTranscripts: 0,
				processed: 0,
				errors: 0,
			}
		}

		// Step 4: Request transcripts for lessons missing them
		let successCount = 0
		let errorCount = 0

		for (let i = 0; i < lessonsToProcess.length; i++) {
			const lesson = lessonsToProcess[i]
			if (!lesson) continue

			const current = i + 1
			const total = lessonsToProcess.length

			// Get only the minimal video resource data needed (id and muxPlaybackId)
			// This minimizes step output size to avoid Inngest limits
			const videoResourceData = await step.run(
				`get video resource ${current}/${total}`,
				async () => {
					const videoResource = await courseBuilderAdapter.getVideoResource(
						lesson.videoResourceId,
					)
					if (!videoResource) {
						return null
					}
					// Only return minimal data needed
					return {
						id: videoResource.id,
						muxPlaybackId: videoResource.muxPlaybackId,
					}
				},
			)

			if (!videoResourceData?.muxPlaybackId) {
				await log.warn('workshop.transcript.batch.skip-no-mux', {
					workshopId: validatedWorkshopId,
					lessonId: lesson.lessonId,
					videoResourceId: lesson.videoResourceId,
				})
				errorCount++
				continue
			}

			// Trigger VIDEO_RESOURCE_CREATED_EVENT which triggers order-transcript from Deepgram
			// Flow: VIDEO_RESOURCE_CREATED_EVENT -> order-transcript (Deepgram) -> webhook -> updateTranscript
			// -> VIDEO_TRANSCRIPT_READY_EVENT -> VIDEO_SRT_READY_EVENT -> SRT to Mux, etc.
			await step.run(`trigger transcript ${current}/${total}`, async () => {
				await inngest.send({
					name: VIDEO_RESOURCE_CREATED_EVENT,
					data: {
						videoResourceId: videoResourceData.id,
						originalMediaUrl: `https://stream.mux.com/${videoResourceData.muxPlaybackId}/low.mp4?download=${videoResourceData.id}`,
					},
				})

				await log.info('workshop.transcript.triggered', {
					workshopId: validatedWorkshopId,
					lessonId: lesson.lessonId,
					videoResourceId: lesson.videoResourceId,
					progress: `${current}/${total}`,
				})
			})

			successCount++

			// Wait before processing the next lesson (except for the last one)
			if (i < lessonsToProcess.length - 1) {
				await step.sleep(
					`rate limit delay ${current}/${total}`,
					`${delaySeconds}s`,
				)
			}
		}

		const result = {
			workshopId: validatedWorkshopId,
			totalLessons: lessonIds.length,
			lessonsWithTranscripts,
			lessonsWithoutTranscripts: lessonsToProcess.length,
			processed: successCount,
			errors: errorCount,
		}

		await log.info('workshop.transcript.batch.complete', result)

		return result
	},
)
