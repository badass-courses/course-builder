import { NextRequest, NextResponse } from 'next/server'
import {
	createAppAbility,
	defineRulesForPurchases,
	getAbility,
} from '@/ability'
import { courseBuilderAdapter, db } from '@/db'
import { contentResource, contentResourceResource } from '@/db/schema'
import { getLesson } from '@/lib/lessons/lessons.service'
import {
	createSolutionForLesson,
	deleteSolutionForLesson,
	getSolutionForLesson,
	SolutionError,
	updateSolutionForLesson,
} from '@/lib/solutions/solutions.service'
import { getUserAbilityForRequest } from '@/server/ability-for-request'
import { log } from '@/server/logger'
import { subject } from '@casl/ability'
import { and, asc, eq, or, sql } from 'drizzle-orm'

const corsHeaders = {
	'Access-Control-Allow-Origin': '*',
	'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
	'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

/**
 * Helper function to create proper ability rules with purchase-based access
 */
async function getAbilityForLesson(request: NextRequest, lessonId: string) {
	const { user } = await getUserAbilityForRequest(request)

	if (!user) {
		return { user: null, ability: getAbility() }
	}

	// Get lesson with parent resources
	const basicAbility = getAbility({ user })
	const lesson = await getLesson(lessonId, basicAbility)
	if (!lesson) {
		return { user, ability: basicAbility, lesson: null }
	}

	// Find the parent workshop for this lesson
	const parentWorkshops = lesson.parentResources || []
	if (parentWorkshops.length === 0) {
		return { user, ability: basicAbility, lesson }
	}

	const workshopSlug = parentWorkshops[0]?.fields?.slug
	if (!workshopSlug) {
		return { user, ability: basicAbility, lesson }
	}

	// Get workshop without session dependency but with resourceProducts for ability rules
	const workshopResult = await db.query.contentResource.findFirst({
		where: and(
			or(
				eq(
					sql`JSON_EXTRACT (${contentResource.fields}, "$.slug")`,
					workshopSlug,
				),
				eq(contentResource.id, workshopSlug),
			),
			eq(contentResource.type, 'workshop'),
		),
		with: {
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
			resourceProducts: {
				with: {
					product: {
						with: {
							price: true,
						},
					},
				},
			},
		},
	})

	if (!workshopResult) {
		return { user, ability: basicAbility, lesson }
	}

	const { WorkshopSchema } = await import('@/lib/workshops')
	const parsedWorkshop = WorkshopSchema.safeParse(workshopResult)
	if (!parsedWorkshop.success) {
		return { user, ability: basicAbility, lesson }
	}

	const workshop = parsedWorkshop.data

	// Get user purchases and create ability rules with device token user
	const purchases = await courseBuilderAdapter.getPurchasesForUser(user.id)
	const allEntitlementTypes = await db.query.entitlementTypes.findMany()

	// Get all workshop resource IDs for ability rules
	const { getWorkshopResourceIds } = await import(
		'@/utils/get-workshop-resource-ids'
	)
	const allModuleResourceIds = getWorkshopResourceIds(workshop)

	const abilityRules = defineRulesForPurchases({
		user,
		purchases,
		module: workshop,
		lesson,
		entitlementTypes: allEntitlementTypes,
		country: request.headers.get('x-vercel-ip-country') || 'US',
		allModuleResourceIds,
	})

	const ability = createAppAbility(abilityRules || [])

	return { user, ability, lesson }
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
		const { ability, user, lesson } = await getAbilityForLesson(
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
		const { ability, user, lesson } = await getAbilityForLesson(
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
		const { ability, user, lesson } = await getAbilityForLesson(
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
		const { ability, user, lesson } = await getAbilityForLesson(
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
