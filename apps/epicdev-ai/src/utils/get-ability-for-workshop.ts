import type { NextRequest } from 'next/server'
import {
	createAppAbility,
	defineRulesForPurchases,
	getAbility,
} from '@/ability'
import { courseBuilderAdapter, db } from '@/db'
import { contentResource, contentResourceResource } from '@/db/schema'
import { WorkshopSchema } from '@/lib/workshops'
import { getUserAbilityForRequest } from '@/server/ability-for-request'
import { getWorkshopResourceIds } from '@/utils/get-workshop-resource-ids'
import { and, asc, eq, or, sql } from 'drizzle-orm'

/**
 * Helper function to create proper ability rules with purchase-based access for a workshop
 */
export async function getAbilityForWorkshop(
	request: NextRequest,
	workshopSlug: string,
) {
	const { user } = await getUserAbilityForRequest(request)

	if (!user) {
		return { user: null, ability: getAbility(), workshop: null }
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
		return { user, ability: getAbility({ user }), workshop: null }
	}

	const parsedWorkshop = WorkshopSchema.safeParse(workshopResult)
	if (!parsedWorkshop.success) {
		return { user, ability: getAbility({ user }), workshop: null }
	}

	const workshop = parsedWorkshop.data

	// Get user purchases and create ability rules with device token user
	const purchases = await courseBuilderAdapter.getPurchasesForUser(user.id)
	const allEntitlementTypes = await db.query.entitlementTypes.findMany()

	// Get all workshop resource IDs for ability rules

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

	return { user, ability, workshop }
}
