import { NextRequest, NextResponse } from 'next/server'
import { createAppAbility, defineRulesForPurchases } from '@/ability'
import { courseBuilderAdapter, db } from '@/db'
import { contentResource, contentResourceResource } from '@/db/schema'
import { getUserAbilityForRequest } from '@/server/ability-for-request'
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

export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ slug: string }> },
) {
	const { slug } = await params
	try {
		const { user } = await getUserAbilityForRequest(request)

		if (!user) {
			return NextResponse.json(false, { headers: corsHeaders })
		}

		// Get workshop without session dependency but with resourceProducts for ability rules
		const workshopResult = await db.query.contentResource.findFirst({
			where: and(
				or(
					eq(sql`JSON_EXTRACT (${contentResource.fields}, "$.slug")`, slug),
					eq(contentResource.id, slug),
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
			return NextResponse.json(false, { headers: corsHeaders })
		}

		const { WorkshopSchema } = await import('@/lib/workshops')
		const parsedWorkshop = WorkshopSchema.safeParse(workshopResult)
		if (!parsedWorkshop.success) {
			return NextResponse.json(false, { headers: corsHeaders })
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
			entitlementTypes: allEntitlementTypes,
			country: request.headers.get('x-vercel-ip-country') || 'US',
			allModuleResourceIds,
		})

		const ability = createAppAbility(abilityRules || [])

		// Check content access (ability system already handles startsAt logic)
		const hasContentAccess = ability.can(
			'read',
			subject('Content', { id: workshop.id }),
		)

		// Check if user is admin (can bypass all restrictions)
		const isAdmin = ability.can('create', 'Content')

		// Check if access is pending due to workshop not started yet
		const isPendingOpenAccess = ability.can('read', 'PendingOpenAccess')

		// Final decision: admin bypasses everything, others need actual content access
		const canViewContent = isAdmin || hasContentAccess

		return NextResponse.json(canViewContent, { headers: corsHeaders })
	} catch (error) {
		return NextResponse.json(false, { headers: corsHeaders })
	}
}

export const dynamic = 'force-dynamic'
