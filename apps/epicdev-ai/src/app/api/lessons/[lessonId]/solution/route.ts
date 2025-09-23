import { NextRequest, NextResponse } from 'next/server'
import {
	createSolutionForLesson,
	deleteSolutionForLesson,
	getSolutionForLesson,
	SolutionError,
	updateSolutionForLesson,
} from '@/lib/solutions/solutions.service'
import { log } from '@/server/logger'
import { getAbilityForLessonById } from '@/utils/get-ability-for-lesson-by-id'
import { subject } from '@casl/ability'

const corsHeaders = {
	'Access-Control-Allow-Origin': '*',
	'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
	'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

export async function OPTIONS() {
	return NextResponse.json({}, { headers: corsHeaders })
}

export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ lessonId: string }> },
) {
	const { lessonId } = await params

	try {
		const { ability, user, lesson } = await getAbilityForLessonById(
			request,
			lessonId,
		)
		await log.info('api.lessons.solution.get.started', {
			userId: user?.id,
			lessonId,
			hasAbility: !!ability,
		})

		if (!user) {
			await log.warn('api.lessons.solution.get.unauthorized', {
				lessonId,
			})
			return NextResponse.json(
				{ error: 'Unauthorized' },
				{ status: 401, headers: corsHeaders },
			)
		}

		if (!lesson) {
			await log.warn('api.lessons.solution.get.lesson_not_found', {
				userId: user.id,
				lessonId,
			})
			return NextResponse.json(
				{ error: 'Lesson not found' },
				{ status: 404, headers: corsHeaders },
			)
		}

		// Check if user can read this lesson (which should allow access to its solution)
		const canReadLesson = ability.can(
			'read',
			subject('Content', { id: lesson.id }),
		)
		const isAdmin = ability.can('create', 'Content')

		if (!isAdmin && !canReadLesson) {
			await log.warn('api.lessons.solution.get.access_denied', {
				userId: user.id,
				lessonId: lesson.id,
			})
			return NextResponse.json(
				{ error: 'Access denied' },
				{ status: 403, headers: corsHeaders },
			)
		}

		const result = await getSolutionForLesson(lessonId, ability)

		await log.info('api.lessons.solution.get.success', {
			userId: user.id,
			lessonId,
			hasSolution: !!result,
		})

		return NextResponse.json(result, { headers: corsHeaders })
	} catch (error) {
		if (error instanceof SolutionError) {
			await log.error('api.lessons.solution.get.error', {
				error: error.message,
				details: error.details,
				statusCode: error.statusCode,
				lessonId,
			})
			return NextResponse.json(
				{ error: error.message, details: error.details },
				{ status: error.statusCode, headers: corsHeaders },
			)
		}
		await log.error('api.lessons.solution.get.failed', {
			error: error instanceof Error ? error.message : 'Unknown error',
			stack: error instanceof Error ? error.stack : undefined,
			lessonId,
		})
		return NextResponse.json(
			{ error: 'Internal server error' },
			{ status: 500, headers: corsHeaders },
		)
	}
}

export async function PUT(
	request: NextRequest,
	{ params }: { params: Promise<{ lessonId: string }> },
) {
	const { lessonId } = await params
	try {
		const body = await request.json()
		const { ability, user, lesson } = await getAbilityForLessonById(
			request,
			lessonId,
		)
		await log.info('api.lessons.solution.put.started', {
			userId: user?.id,
			lessonId,
			hasAbility: !!ability,
		})

		if (!user?.id) {
			await log.warn('api.lessons.solution.put.unauthorized', {
				userId: user?.id,
				lessonId,
			})
			return NextResponse.json(
				{ error: 'Unauthorized' },
				{ status: 401, headers: corsHeaders },
			)
		}

		if (!lesson) {
			await log.warn('api.lessons.solution.put.lesson_not_found', {
				userId: user.id,
				lessonId,
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
			await log.warn('api.lessons.solution.put.access_denied', {
				userId: user.id,
				lessonId: lesson.id,
			})
			return NextResponse.json(
				{ error: 'Access denied - content creation/management required' },
				{ status: 403, headers: corsHeaders },
			)
		}

		const result = await updateSolutionForLesson(
			lessonId,
			ability,
			body,
			user.id,
		)

		await log.info('api.lessons.solution.put.success', {
			userId: user.id,
			lessonId,
		})

		return NextResponse.json(result, { headers: corsHeaders })
	} catch (error) {
		if (error instanceof SolutionError) {
			await log.error('api.lessons.solution.put.error', {
				error: error.message,
				details: error.details,
				statusCode: error.statusCode,
				lessonId,
			})
			return NextResponse.json(
				{ error: error.message, details: error.details },
				{ status: error.statusCode, headers: corsHeaders },
			)
		}
		await log.error('api.lessons.solution.put.failed', {
			error: error instanceof Error ? error.message : 'Unknown error',
			stack: error instanceof Error ? error.stack : undefined,
			lessonId,
		})
		return NextResponse.json(
			{ error: 'Internal server error' },
			{ status: 500, headers: corsHeaders },
		)
	}
}

export async function POST(
	request: NextRequest,
	{ params }: { params: Promise<{ lessonId: string }> },
) {
	const { lessonId } = await params
	try {
		const body = await request.json()
		const { ability, user, lesson } = await getAbilityForLessonById(
			request,
			lessonId,
		)

		if (!user?.id) {
			await log.warn('api.lessons.solution.post.unauthorized', {
				userId: user?.id,
				lessonId,
			})
			return NextResponse.json(
				{ error: 'Unauthorized' },
				{ status: 401, headers: corsHeaders },
			)
		}

		if (!lesson) {
			await log.warn('api.lessons.solution.post.lesson_not_found', {
				userId: user.id,
				lessonId,
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
			await log.warn('api.lessons.solution.post.access_denied', {
				userId: user.id,
				lessonId: lesson.id,
			})
			return NextResponse.json(
				{ error: 'Access denied - content creation/management required' },
				{ status: 403, headers: corsHeaders },
			)
		}

		const solution = await createSolutionForLesson(
			lessonId,
			ability,
			body,
			user.id,
		)

		return NextResponse.json(solution, { headers: corsHeaders })
	} catch (error) {
		if (error instanceof SolutionError) {
			await log.error('api.lessons.solution.post.error', {
				error: error.message,
				details: error.details,
				statusCode: error.statusCode,
				lessonId,
			})
			return NextResponse.json(
				{ error: error.message, details: error.details },
				{ status: error.statusCode, headers: corsHeaders },
			)
		}
		await log.error('api.lessons.solution.post.failed', {
			error: error instanceof Error ? error.message : 'Unknown error',
			stack: error instanceof Error ? error.stack : undefined,
			lessonId,
		})
		return NextResponse.json(
			{ error: 'Internal server error' },
			{ status: 500, headers: corsHeaders },
		)
	}
}

export async function DELETE(
	request: NextRequest,
	{ params }: { params: Promise<{ lessonId: string }> },
) {
	const { lessonId } = await params
	try {
		const { ability, user, lesson } = await getAbilityForLessonById(
			request,
			lessonId,
		)

		if (!user?.id) {
			await log.warn('api.lessons.solution.delete.unauthorized', {
				userId: user?.id,
				lessonId,
			})
			return NextResponse.json(
				{ error: 'Unauthorized' },
				{ status: 401, headers: corsHeaders },
			)
		}

		if (!lesson) {
			await log.warn('api.lessons.solution.delete.lesson_not_found', {
				userId: user.id,
				lessonId,
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
			await log.warn('api.lessons.solution.delete.access_denied', {
				userId: user.id,
				lessonId: lesson.id,
			})
			return NextResponse.json(
				{ error: 'Access denied - content creation/management required' },
				{ status: 403, headers: corsHeaders },
			)
		}

		const solution = await deleteSolutionForLesson(lessonId, ability, user.id)

		return NextResponse.json(solution, { headers: corsHeaders })
	} catch (error) {
		if (error instanceof SolutionError) {
			await log.error('api.lessons.solution.delete.error', {
				error: error.message,
				details: error.details,
				statusCode: error.statusCode,
				lessonId,
			})
			return NextResponse.json(
				{ error: error.message, details: error.details },
				{ status: error.statusCode, headers: corsHeaders },
			)
		}
		await log.error('api.lessons.solution.delete.failed', {
			error: error instanceof Error ? error.message : 'Unknown error',
			stack: error instanceof Error ? error.stack : undefined,
			lessonId,
		})
		return NextResponse.json(
			{ error: 'Internal server error' },
			{ status: 500, headers: corsHeaders },
		)
	}
}
