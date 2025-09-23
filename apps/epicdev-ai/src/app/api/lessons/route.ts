import { NextRequest, NextResponse } from 'next/server'
import {
	createAppAbility,
	defineRulesForPurchases,
	getAbility,
} from '@/ability'
import { courseBuilderAdapter, db } from '@/db'
import { contentResource, contentResourceResource } from '@/db/schema'
import {
	getLesson,
	getLessons,
	LessonError,
	updateLesson,
} from '@/lib/lessons/lessons.service'
import { getUserAbilityForRequest } from '@/server/ability-for-request'
import { log } from '@/server/logger'
import { getAbilityForLessonById } from '@/utils/get-ability-for-lesson-by-id'
import { subject } from '@casl/ability'
import { and, asc, eq, or, sql } from 'drizzle-orm'

const corsHeaders = {
	'Access-Control-Allow-Origin': '*',
	'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
	'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

export async function OPTIONS() {
	return NextResponse.json({}, { headers: corsHeaders })
}

export async function GET(request: NextRequest) {
	const { searchParams } = new URL(request.url)
	const slugOrId = searchParams.get('slugOrId')

	try {
		await log.info('api.lessons.get.started', {
			slugOrId,
		})

		if (!slugOrId) {
			await log.warn('api.lessons.get.invalid', {
				error: 'Missing slugOrId parameter',
			})
			return NextResponse.json(
				{ error: 'Missing slugOrId parameter' },
				{ status: 400, headers: corsHeaders },
			)
		}

		const { user, ability, lesson } = await getAbilityForLessonById(
			request,
			slugOrId,
		)

		if (!user) {
			await log.warn('api.lessons.get.unauthorized', {
				slugOrId,
			})
			return NextResponse.json(
				{ error: 'Unauthorized' },
				{ status: 401, headers: corsHeaders },
			)
		}

		if (!lesson) {
			await log.warn('api.lessons.get.lesson_not_found', {
				userId: user.id,
				slugOrId,
			})
			return NextResponse.json(
				{ error: 'Lesson not found' },
				{ status: 404, headers: corsHeaders },
			)
		}

		// Check if user can read this specific lesson based on entitlements only
		const canReadLesson = ability.can(
			'read',
			subject('Content', { id: lesson.id }),
		)

		if (!canReadLesson) {
			await log.warn('api.lessons.get.access_denied', {
				userId: user.id,
				lessonId: lesson.id,
			})
			return NextResponse.json(
				{ error: 'Access denied - valid entitlements required' },
				{ status: 403, headers: corsHeaders },
			)
		}

		await log.info('api.lessons.get.success', {
			userId: user.id,
			lessonId: lesson.id,
			canReadLesson,
		})

		return NextResponse.json(lesson, { headers: corsHeaders })
	} catch (error) {
		if (error instanceof LessonError) {
			await log.error('api.lessons.get.error', {
				error: error.message,
				details: error.details,
				statusCode: error.statusCode,
				slugOrId,
			})
			return NextResponse.json(
				{ error: error.message, details: error.details },
				{ status: error.statusCode, headers: corsHeaders },
			)
		}
		await log.error('api.lessons.get.failed', {
			error: error instanceof Error ? error.message : 'Unknown error',
			stack: error instanceof Error ? error.stack : undefined,
			slugOrId,
		})
		return NextResponse.json(
			{ error: 'Internal server error' },
			{ status: 500, headers: corsHeaders },
		)
	}
}

export async function PUT(request: NextRequest) {
	const { searchParams } = new URL(request.url)
	const id = searchParams.get('id')

	try {
		if (!id) {
			await log.warn('api.lessons.put.invalid', {
				error: 'Missing lesson ID',
			})
			return NextResponse.json(
				{ error: 'Missing lesson ID' },
				{ status: 400, headers: corsHeaders },
			)
		}

		const { ability, user, lesson } = await getAbilityForLessonById(request, id)

		if (!user) {
			await log.warn('api.lessons.put.unauthorized', {
				lessonId: id,
			})
			return NextResponse.json(
				{ error: 'Unauthorized' },
				{ status: 401, headers: corsHeaders },
			)
		}

		if (!lesson) {
			await log.warn('api.lessons.put.lesson_not_found', {
				userId: user.id,
				lessonId: id,
			})
			return NextResponse.json(
				{ error: 'Lesson not found' },
				{ status: 404, headers: corsHeaders },
			)
		}

		// Check if user can create/manage content (admins or contributors only)
		const canCreateContent = ability.can('create', 'Content')
		const canManageLesson = ability.can(
			'manage',
			subject('Content', { id: lesson.id }),
		)
		const isAdmin = ability.can('manage', 'all')

		if (!isAdmin && !canCreateContent && !canManageLesson) {
			await log.warn('api.lessons.put.access_denied', {
				userId: user.id,
				lessonId: lesson.id,
			})
			return NextResponse.json(
				{ error: 'Access denied - content creation/management required' },
				{ status: 403, headers: corsHeaders },
			)
		}

		const body = await request.json()
		await log.info('api.lessons.put.started', {
			userId: user.id,
			lessonId: id,
			changes: Object.keys(body),
		})

		const result = await updateLesson({
			id,
			data: body,
			action: body.action,
			userId: user.id,
			ability,
		})

		await log.info('api.lessons.put.success', {
			userId: user.id,
			lessonId: id,
		})

		return NextResponse.json(result, { headers: corsHeaders })
	} catch (error) {
		if (error instanceof LessonError) {
			await log.error('api.lessons.put.error', {
				error: error.message,
				details: error.details,
				statusCode: error.statusCode,
				lessonId: id,
			})
			return NextResponse.json(
				{ error: error.message, details: error.details },
				{ status: error.statusCode, headers: corsHeaders },
			)
		}
		if (error instanceof Error) {
			await log.error('api.lessons.put.error', {
				error: error.message,
				stack: error.stack,
				lessonId: id,
			})
			return NextResponse.json(
				{ error: error.message },
				{ status: 500, headers: corsHeaders },
			)
		}
		await log.error('api.lessons.put.failed', {
			error: 'Unknown error',
			lessonId: id,
		})
		return NextResponse.json(
			{ error: 'Internal server error' },
			{ status: 500, headers: corsHeaders },
		)
	}
}
