import { NextRequest, NextResponse } from 'next/server'
import { courseBuilderAdapter, db } from '@/db'
import { resourceProgress } from '@/db/schema'
import { getLesson } from '@/lib/lessons/lessons.service'
import { sendInngestProgressEvent } from '@/lib/progress'
import { getUserAbilityForRequest } from '@/server/ability-for-request'
import { log } from '@/server/logger'
import { and, eq } from 'drizzle-orm'

import { resourceProgressSchema } from '@coursebuilder/core/schemas'

/**
 * Sets resource progress for a specific user (bypasses session-based auth)
 */
async function setResourceProgressForUser({
	userId,
	resourceId,
	completedAt,
}: {
	userId: string
	resourceId: string
	completedAt: Date | null
}) {
	// Delete any existing progress
	await db
		.delete(resourceProgress)
		.where(
			and(
				eq(resourceProgress.resourceId, resourceId),
				eq(resourceProgress.userId, userId),
			),
		)

	// If not completed, just return null (progress removed)
	if (!completedAt) return null

	// Insert new progress
	const now = new Date()
	const progress = {
		userId,
		resourceId,
		completedAt,
		updatedAt: now,
	}
	await db.insert(resourceProgress).values(progress)

	return resourceProgressSchema.parse(progress)
}

const corsHeaders = {
	'Access-Control-Allow-Origin': '*',
	'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
	'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

/**
 * OPTIONS /api/progress
 * Handles CORS preflight requests
 * @returns Empty response with CORS headers
 */
export async function OPTIONS() {
	return NextResponse.json({}, { headers: corsHeaders })
}

/**
 * GET /api/progress
 * Fetches lesson progress for the authenticated user with device token
 * @param request - NextRequest object containing authorization headers
 * @returns Array of lesson progress objects with lessonId and completedAt
 */
export async function GET(request: NextRequest) {
	try {
		const { ability, user } = await getUserAbilityForRequest(request)

		await log.info('api.progress.get.started', {
			userId: user?.id,
			hasAbility: !!ability,
		})

		if (!user) {
			await log.warn('api.progress.get.unauthorized', {
				headers: Object.fromEntries(request.headers),
			})
			return new NextResponse(null, {
				status: 403,
				headers: corsHeaders,
			})
		}

		const lessonProgress = await courseBuilderAdapter.getLessonProgressForUser(
			user.id,
		)

		const progressData = (lessonProgress || []).map((progress) => ({
			lessonId: progress.resourceId,
			completedAt: progress.completedAt,
		}))

		await log.info('api.progress.get.success', {
			userId: user.id,
			progressCount: progressData.length,
		})

		return NextResponse.json(progressData, { headers: corsHeaders })
	} catch (error) {
		await log.error('api.progress.get.failed', {
			error: error instanceof Error ? error.message : 'Unknown error',
			stack: error instanceof Error ? error.stack : undefined,
		})
		return NextResponse.json(
			{ error: 'Internal server error' },
			{ status: 500, headers: corsHeaders },
		)
	}
}

/**
 * POST /api/progress
 * Creates or removes lesson progress for the authenticated user with device token
 * @param request - NextRequest object containing authorization headers and JSON body
 * @param request.body.lessonSlug - The lesson slug to update progress for
 * @param request.body.remove - Optional. If true, removes progress instead of creating it
 * @returns Progress object with lessonId and completedAt, or success confirmation for removal
 */
export async function POST(request: NextRequest) {
	try {
		const { ability, user } = await getUserAbilityForRequest(request)

		if (!user) {
			await log.warn('api.progress.post.unauthorized', {
				headers: Object.fromEntries(request.headers),
			})
			return new NextResponse(null, {
				status: 403,
				headers: corsHeaders,
			})
		}

		const body = await request.json()
		const { lessonSlug, remove = false } = body

		if (!lessonSlug) {
			await log.warn('api.progress.post.invalid', {
				userId: user.id,
				error: 'Missing lessonSlug',
				body,
			})
			return NextResponse.json(
				{ error: 'Missing lessonSlug' },
				{ status: 400, headers: corsHeaders },
			)
		}

		await log.info('api.progress.post.started', {
			userId: user.id,
			lessonSlug,
			remove,
		})

		// Get the lesson with proper authorization using lessons service
		const lesson = await getLesson(lessonSlug, ability)
		if (!lesson) {
			await log.warn('api.progress.post.lesson_not_found', {
				userId: user.id,
				lessonSlug,
			})
			return NextResponse.json(
				{ error: 'Lesson not found' },
				{ status: 404, headers: corsHeaders },
			)
		}

		if (remove) {
			// Check if progress exists before removing (to match legacy behavior)
			const existingProgress =
				await courseBuilderAdapter.getLessonProgressForUser(user.id)
			const hasProgress = existingProgress?.some(
				(p) => p.resourceId === lesson.id,
			)

			if (!hasProgress) {
				await log.warn('api.progress.post.progress_not_found', {
					userId: user.id,
					lessonId: lesson.id,
				})
				return new NextResponse(null, {
					status: 404,
					headers: corsHeaders,
				})
			}

			// Remove progress by setting completedAt to null
			await setResourceProgressForUser({
				userId: user.id,
				resourceId: lesson.id,
				completedAt: null,
			})

			await log.info('api.progress.post.removed', {
				userId: user.id,
				lessonId: lesson.id,
				lessonSlug,
			})

			return new NextResponse(null, {
				status: 200,
				headers: corsHeaders,
			})
		} else {
			// Complete the lesson by setting completedAt to current time
			const progress = await setResourceProgressForUser({
				userId: user.id,
				resourceId: lesson.id,
				completedAt: new Date(),
			})

			if (!progress) {
				await log.error('api.progress.post.completion_failed', {
					userId: user.id,
					lessonId: lesson.id,
					lessonSlug,
				})
				return NextResponse.json(
					{ error: 'Failed to complete lesson' },
					{ status: 500, headers: corsHeaders },
				)
			}

			// Send Inngest event using existing utility
			await sendInngestProgressEvent({
				user,
				lessonId: lesson.id,
				lessonSlug: lesson.fields?.slug || lessonSlug,
			})

			await log.info('api.progress.post.completed', {
				userId: user.id,
				lessonId: lesson.id,
				lessonSlug,
				completedAt: progress.completedAt,
			})

			return NextResponse.json(
				{
					lessonId: progress.resourceId,
					completedAt: progress.completedAt,
				},
				{ status: 200, headers: corsHeaders },
			)
		}
	} catch (error) {
		await log.error('api.progress.post.failed', {
			error: error instanceof Error ? error.message : 'Unknown error',
			stack: error instanceof Error ? error.stack : undefined,
		})
		return NextResponse.json(
			{ error: 'Internal server error' },
			{ status: 500, headers: corsHeaders },
		)
	}
}

export const dynamic = 'force-dynamic'
