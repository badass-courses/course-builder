import { NextRequest, NextResponse } from 'next/server'
import { courseBuilderAdapter, db } from '@/db'
import {
	contentResource,
	contentResourceResource,
	contentResourceTag as contentResourceTagTable,
} from '@/db/schema'
import { getUserAbilityForRequest } from '@/server/ability-for-request'
import { log } from '@/server/logger'
import { and, asc, desc, eq, inArray, or, sql } from 'drizzle-orm'
import { z } from 'zod'

const corsHeaders = {
	'Access-Control-Allow-Origin': '*',
	'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
	'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

const WorkshopCreateSchema = z.object({
	workshop: z.object({
		title: z.string(),
		description: z.string().optional(),
	}),
	createProduct: z.boolean().optional(),
	pricing: z
		.object({
			price: z.number().nullable().optional(),
			quantity: z.number().nullable().optional(),
		})
		.optional()
		.default({}),
	coupon: z
		.object({
			enabled: z.boolean(),
			percentageDiscount: z.string().optional(),
			expires: z.coerce.date().optional(),
		})
		.optional(),
	structure: z.array(
		z.union([
			z.object({
				type: z.literal('section'),
				title: z.string(),
				lessons: z.array(
					z.object({
						title: z.string(),
						videoResourceId: z.string().optional(),
					}),
				),
			}),
			z.object({
				type: z.literal('lesson'),
				title: z.string(),
				videoResourceId: z.string().optional(),
			}),
		]),
	),
})

export async function OPTIONS() {
	return NextResponse.json({}, { headers: corsHeaders })
}

export async function GET(request: NextRequest) {
	const { searchParams } = new URL(request.url)
	const slugOrId = searchParams.get('slugOrId')

	try {
		const { ability, user } = await getUserAbilityForRequest(request)
		await log.info('api.workshops.get.started', {
			userId: user?.id,
			slugOrId,
			hasAbility: !!ability,
		})

		const visibility: ('public' | 'private' | 'unlisted')[] = ability.can(
			'update',
			'Content',
		)
			? ['public', 'private', 'unlisted']
			: ['public', 'unlisted']

		if (slugOrId) {
			const workshop = await db.query.contentResource.findFirst({
				where: and(
					or(
						eq(
							sql`JSON_EXTRACT (${contentResource.fields}, "$.slug")`,
							slugOrId,
						),
						eq(contentResource.id, slugOrId),
					),
					eq(contentResource.type, 'workshop'),
					inArray(
						sql`JSON_EXTRACT (${contentResource.fields}, "$.visibility")`,
						visibility,
					),
				),
				with: {
					tags: {
						with: { tag: true },
						orderBy: asc(contentResourceTagTable.position),
					},
					resources: {
						with: {
							resource: {
								with: {
									resources: {
										with: { resource: true },
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
								with: { price: true },
							},
						},
					},
				},
			})

			if (!workshop) {
				await log.warn('api.workshops.get.notFound', {
					userId: user?.id,
					slugOrId,
				})
				return NextResponse.json(
					{ error: 'Workshop not found' },
					{ status: 404, headers: corsHeaders },
				)
			}

			await log.info('api.workshops.get.success', {
				userId: user?.id,
				workshopId: workshop.id,
				slugOrId,
			})

			return NextResponse.json(workshop, { headers: corsHeaders })
		}

		const workshops = await db.query.contentResource.findMany({
			where: and(
				eq(contentResource.type, 'workshop'),
				inArray(
					sql`JSON_EXTRACT (${contentResource.fields}, "$.visibility")`,
					visibility,
				),
			),
			with: {
				tags: {
					with: { tag: true },
					orderBy: asc(contentResourceTagTable.position),
				},
				resources: {
					orderBy: asc(contentResourceResource.position),
					with: { resource: true },
				},
			},
			orderBy: desc(contentResource.createdAt),
		})

		await log.info('api.workshops.get.success', {
			userId: user?.id,
			resultCount: workshops.length,
		})

		return NextResponse.json(workshops, { headers: corsHeaders })
	} catch (error) {
		await log.error('api.workshops.get.failed', {
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

export async function POST(request: NextRequest) {
	try {
		const { ability, user } = await getUserAbilityForRequest(request)

		if (!user) {
			await log.warn('api.workshops.post.unauthorized', {
				headers: Object.fromEntries(request.headers),
			})
			return NextResponse.json(
				{ error: 'Unauthorized' },
				{ status: 401, headers: corsHeaders },
			)
		}

		if (ability.cannot('create', 'Content')) {
			await log.warn('api.workshops.post.forbidden', {
				userId: user.id,
			})
			return NextResponse.json(
				{ error: 'Forbidden' },
				{ status: 403, headers: corsHeaders },
			)
		}

		const body = await request.json()

		const parsed = WorkshopCreateSchema.safeParse(body)
		if (!parsed.success) {
			await log.warn('api.workshops.post.invalidInput', {
				userId: user.id,
				errors: parsed.error.errors,
			})
			return NextResponse.json(
				{ error: 'Invalid input', details: parsed.error.errors },
				{ status: 400, headers: corsHeaders },
			)
		}

		await log.info('api.workshops.post.started', {
			userId: user.id,
			title: parsed.data.workshop.title,
			structureLength: parsed.data.structure.length,
		})

		const result = await courseBuilderAdapter.createWorkshop(
			{
				...parsed.data,
				pricing: parsed.data.pricing ?? {},
			},
			user.id,
		)

		await log.info('api.workshops.post.success', {
			userId: user.id,
			workshopId: result.workshop.id,
			sectionCount: result.sections.length,
			lessonCount: result.lessons.length,
			hasProduct: !!result.product,
		})

		return NextResponse.json(
			{ success: true, ...result },
			{ status: 201, headers: corsHeaders },
		)
	} catch (error) {
		if (error instanceof z.ZodError) {
			return NextResponse.json(
				{ error: 'Invalid input', details: error.errors },
				{ status: 400, headers: corsHeaders },
			)
		}
		await log.error('api.workshops.post.failed', {
			error: error instanceof Error ? error.message : 'Unknown error',
			stack: error instanceof Error ? error.stack : undefined,
		})
		return NextResponse.json(
			{ error: 'Internal server error' },
			{ status: 500, headers: corsHeaders },
		)
	}
}
