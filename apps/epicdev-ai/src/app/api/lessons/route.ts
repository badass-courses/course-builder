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
import { subject } from '@casl/ability'
import { and, asc, eq, or, sql } from 'drizzle-orm'

const corsHeaders = {
	'Access-Control-Allow-Origin': '*',
	'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
	'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

/**
 * Helper function to create proper ability rules with purchase-based access for a specific lesson
 */
async function getAbilityForLessonById(request: NextRequest, lessonId: string) {
	const { user } = await getUserAbilityForRequest(request)

	if (!user) {
		return { user: null, ability: getAbility(), lesson: null }
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

export async function GET(request: NextRequest) {
	const { searchParams } = new URL(request.url)
	const slugOrId = searchParams.get('slugOrId')

	try {
		const { user } = await getUserAbilityForRequest(request)
		await log.info('api.lessons.get.started', {
			userId: user?.id,
			slugOrId,
		})

		if (!user) {
			await log.warn('api.lessons.get.unauthorized', {
				slugOrId,
			})
			return NextResponse.json(
				{ error: 'Unauthorized' },
				{ status: 401, headers: corsHeaders },
			)
		}

		if (!slugOrId) {
			await log.warn('api.lessons.get.invalid', {
				userId: user.id,
				error: 'Missing slugOrId parameter',
			})
			return NextResponse.json(
				{ error: 'Missing slugOrId parameter' },
				{ status: 400, headers: corsHeaders },
			)
		}

		// Get lesson with parent resources using the lessons service
		// We'll create a basic ability for the lesson lookup since we need purchase-based rules later
		const basicAbility = getAbility({ user })
		const lesson = await getLesson(slugOrId, basicAbility)
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

		// Find the parent workshop for this lesson
		const parentWorkshops = lesson.parentResources || []
		if (parentWorkshops.length === 0) {
			await log.warn('api.lessons.get.no_parent_workshop', {
				userId: user.id,
				lessonId: lesson.id,
			})
			return NextResponse.json(
				{ error: 'Lesson has no parent workshop' },
				{ status: 400, headers: corsHeaders },
			)
		}

		// Use the first parent workshop to create ability rules
		const workshopSlug = parentWorkshops[0]?.fields?.slug
		if (!workshopSlug) {
			await log.warn('api.lessons.get.invalid_workshop_slug', {
				userId: user.id,
				lessonId: lesson.id,
			})
			return NextResponse.json(
				{ error: 'Invalid workshop slug' },
				{ status: 400, headers: corsHeaders },
			)
		}

		// Get workshop without session dependency but with resourceProducts for ability rules
		let workshop
		try {
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

			if (workshopResult) {
				console.log('🔍 Workshop result:', workshopResult)
				const { WorkshopSchema } = await import('@/lib/workshops')
				const parsedWorkshop = WorkshopSchema.safeParse(workshopResult)
				if (parsedWorkshop.success) {
					workshop = parsedWorkshop.data
				} else {
					await log.error('api.lessons.get.workshop_parse_error', {
						userId: user.id,
						workshopSlug,
						error: parsedWorkshop.error.format(),
					})
					throw new Error('Failed to parse workshop data')
				}
			}

			await log.info('api.lessons.get.workshop_found', {
				userId: user.id,
				workshopSlug,
				workshopId: workshop?.id,
				hasResourceProducts: !!workshop?.resourceProducts,
			})
		} catch (error) {
			await log.error('api.lessons.get.workshop_error', {
				userId: user.id,
				workshopSlug,
				error: error instanceof Error ? error.message : 'Unknown error',
				stack: error instanceof Error ? error.stack : undefined,
			})
			throw error
		}

		if (!workshop) {
			await log.warn('api.lessons.get.workshop_not_found', {
				userId: user.id,
				workshopSlug,
			})
			return NextResponse.json(
				{ error: 'Workshop not found' },
				{ status: 404, headers: corsHeaders },
			)
		}

		// Get user purchases and create ability rules with device token user
		let purchases, allEntitlementTypes
		try {
			purchases = await courseBuilderAdapter.getPurchasesForUser(user.id)
			allEntitlementTypes = await db.query.entitlementTypes.findMany()
			await log.info('api.lessons.get.data_loaded', {
				userId: user.id,
				purchasesCount: purchases?.length || 0,
				entitlementTypesCount: allEntitlementTypes?.length || 0,
			})
		} catch (error) {
			await log.error('api.lessons.get.data_load_error', {
				userId: user.id,
				error: error instanceof Error ? error.message : 'Unknown error',
				stack: error instanceof Error ? error.stack : undefined,
			})
			throw error
		}

		// Get all workshop resource IDs for ability rules
		const { getWorkshopResourceIds } = await import(
			'@/utils/get-workshop-resource-ids'
		)
		const allModuleResourceIds = getWorkshopResourceIds(workshop)

		let abilityRules, ability
		try {
			abilityRules = defineRulesForPurchases({
				user,
				purchases,
				module: workshop,
				lesson,
				entitlementTypes: allEntitlementTypes,
				country: request.headers.get('x-vercel-ip-country') || 'US',
				allModuleResourceIds,
			})

			ability = createAppAbility(abilityRules || [])

			await log.info('api.lessons.get.ability_rules_created', {
				userId: user.id,
				lessonId: lesson.id,
				workshopId: workshop.id,
				rulesCount: abilityRules?.length || 0,
				userEntitlementsCount: user.entitlements?.length || 0,
			})
		} catch (error) {
			await log.error('api.lessons.get.ability_rules_error', {
				userId: user.id,
				lessonId: lesson.id,
				workshopId: workshop.id,
				error: error instanceof Error ? error.message : 'Unknown error',
				stack: error instanceof Error ? error.stack : undefined,
			})
			throw error
		}

		// Check if user can read this specific lesson
		const canReadLesson = ability.can(
			'read',
			subject('Content', { id: lesson.id }),
		)
		const isAdmin = ability.can('create', 'Content')

		if (!isAdmin && !canReadLesson) {
			await log.warn('api.lessons.get.access_denied', {
				userId: user.id,
				lessonId: lesson.id,
				workshopId: workshop.id,
			})
			return NextResponse.json(
				{ error: 'Access denied' },
				{ status: 403, headers: corsHeaders },
			)
		}

		await log.info('api.lessons.get.success', {
			userId: user.id,
			lessonId: lesson.id,
			isAdmin,
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
