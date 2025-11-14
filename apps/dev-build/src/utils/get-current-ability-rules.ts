// App-specific implementation for coursebuilder
import { headers } from 'next/headers'
import { createAppAbility, defineRulesForPurchases } from '@/ability'
import { courseBuilderAdapter, db } from '@/db'
import {
	contentResource,
	entitlements,
	organizationMemberships,
} from '@/db/schema'
import { getServerAuthSession } from '@/server/auth'
import { log } from '@/server/logger'
import { getSubscriberFromCookie } from '@/trpc/api/routers/ability'
import { subject } from '@casl/ability'
import { and, eq, gt, isNull, or, sql } from 'drizzle-orm'

import { ContentResourceSchema } from '@coursebuilder/core/schemas'
// Import type without implementation
import { type AbilityForResource } from '@coursebuilder/utils-auth/current-ability-rules'

import { getResourceSection } from './get-resource-section'
import { getWorkshopResourceIds } from './get-workshop-resource-ids'

export async function getGenericResource(slugOrId?: string | null) {
	if (!slugOrId) {
		await log.error('No slug or id provided', { slugOrId })
		return null
	}

	const resource = await db.query.contentResource.findFirst({
		where: or(
			eq(sql`JSON_EXTRACT (${contentResource.fields}, "$.slug")`, slugOrId),
			eq(contentResource.id, slugOrId),
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
							},
						},
					},
				},
			},
			resourceProducts: {
				with: {
					product: true,
				},
			},
		},
	})
	const parsedResource = ContentResourceSchema.safeParse(resource)

	return parsedResource.success ? parsedResource.data : null
}

// Provide the actual implementation directly
export async function getCurrentAbilityRules({
	resourceId,
	moduleId,
	organizationId: orgId,
}: {
	resourceId?: string
	moduleId?: string
	organizationId?: string
}) {
	const headerStore = await headers()
	const country =
		headerStore.get('x-vercel-ip-country') ||
		process.env.DEFAULT_COUNTRY ||
		'US'

	const organizationId = orgId || headerStore.get('x-organization-id')

	const convertkitSubscriber = await getSubscriberFromCookie()

	const { session } = await getServerAuthSession()

	const resource = await getGenericResource(resourceId)
	const moduleResource = await getGenericResource(moduleId)

	const sectionResource =
		resource &&
		moduleResource &&
		(await getResourceSection(resource.id, moduleResource))

	const purchases = await courseBuilderAdapter.getPurchasesForUser(
		session?.user?.id,
	)

	const allModuleResourceIds = moduleResource
		? getWorkshopResourceIds(moduleResource)
		: []

	const entitlementTypes = await db.query.entitlementTypes.findMany()

	const currentMembership =
		session?.user && organizationId
			? await db.query.organizationMemberships.findFirst({
					where: and(
						eq(organizationMemberships.organizationId, organizationId),
						eq(organizationMemberships.userId, session.user.id),
					),
				})
			: null

	const activeEntitlements = currentMembership
		? await db.query.entitlements.findMany({
				where: and(
					eq(entitlements.organizationMembershipId, currentMembership.id),
					or(
						isNull(entitlements.expiresAt),
						gt(entitlements.expiresAt, sql`CURRENT_TIMESTAMP`),
					),
					isNull(entitlements.deletedAt),
				),
			})
		: []

	return defineRulesForPurchases({
		user: {
			...session?.user,
			id: session?.user?.id || '',
			entitlements: activeEntitlements.map((e) => ({
				type: e.entitlementType,
				expires: e.expiresAt,
				metadata: e.metadata || {},
			})),
		},
		country,
		entitlementTypes,
		isSolution: false,
		...(convertkitSubscriber && {
			subscriber: convertkitSubscriber,
		}),
		...(resource && { resource: resource }),
		...(moduleResource && { module: moduleResource }),
		...(sectionResource ? { section: sectionResource } : {}),
		...(purchases && { purchases: purchases }),
		allModuleResourceIds,
	})
}

export async function getAbilityForResource(
	resourceId: string | undefined,
	moduleId: string,
): Promise<
	Omit<AbilityForResource, 'canView'> & {
		canViewWorkshop: boolean
		canViewLesson: boolean
		isPendingOpenAccess: boolean
	}
> {
	const abilityRules = await getCurrentAbilityRules({
		resourceId,
		moduleId,
	})
	const moduleResource = await getGenericResource(moduleId)
	const resource = await getGenericResource(resourceId)

	const ability = createAppAbility(abilityRules || [])

	const canViewWorkshop = moduleResource
		? ability.can('read', subject('Content', { id: moduleResource.id }))
		: false

	const canViewLesson = resource?.id
		? ability.can('read', subject('Content', { id: resource.id }))
		: false
	const canInviteTeam = ability.can('read', 'Team')
	const isRegionRestricted = ability.can('read', 'RegionRestriction')
	const isPendingOpenAccess = ability.can('read', 'PendingOpenAccess')
	const canCreate = ability.can('create', 'Content')

	return {
		canViewWorkshop,
		canViewLesson,
		canInviteTeam,
		isRegionRestricted,
		isPendingOpenAccess,
		canCreate,
	}
}

// Re-export the type for compatibility
export type { AbilityForResource }
