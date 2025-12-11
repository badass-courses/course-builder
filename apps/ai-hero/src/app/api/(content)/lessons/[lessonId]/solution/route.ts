import { NextRequest, NextResponse } from 'next/server'
import {
	createSolutionForLesson,
	deleteSolutionForLesson,
	getSolutionForLesson,
	SolutionError,
	updateSolutionForLesson,
} from '@/lib/solutions/solutions.service'
import { getUserAbilityForRequest } from '@/server/ability-for-request'
import { log } from '@/server/logger'

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
		const { ability, user } = await getUserAbilityForRequest(request)
		await log.info('api.lessons.solution.get.started', {
			userId: user?.id,
			lessonId,
			hasAbility: !!ability,
		})

		const result = await getSolutionForLesson(lessonId, ability)

		await log.info('api.lessons.get.success', {
			userId: user?.id,
			lessonId,
			result,
		})

		return NextResponse.json(result, { headers: corsHeaders })
	} catch (error) {
		if (error instanceof SolutionError) {
			await log.error('api.lessons.get.error', {
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
		await log.error('api.lessons.get.failed', {
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
		const { ability, user } = await getUserAbilityForRequest(request)
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
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
		}
		const result = await updateSolutionForLesson(
			lessonId,
			ability,
			body,
			user.id,
		)

		await log.info('api.lessons.solution.put.success', {
			userId: user?.id,
			lessonId,
			result,
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
		const { ability, user } = await getUserAbilityForRequest(request)

		if (!user?.id) {
			await log.warn('api.lessons.solution.post.unauthorized', {
				userId: user?.id,
				lessonId,
			})
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
		}
		const solution = await createSolutionForLesson(
			lessonId,
			ability,
			body,
			user?.id,
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
		const { ability, user } = await getUserAbilityForRequest(request)

		if (!user?.id) {
			await log.warn('api.lessons.solution.post.unauthorized', {
				userId: user?.id,
				lessonId,
			})
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
		}
		const solution = await deleteSolutionForLesson(lessonId, ability, user?.id)

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
