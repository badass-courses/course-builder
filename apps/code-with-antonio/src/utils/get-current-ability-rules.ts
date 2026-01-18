// App-specific implementation for coursebuilder
import { headers } from 'next/headers'
import { createAppAbility, defineRulesForPurchases } from '@/ability'
import { courseBuilderAdapter, db } from '@/db'
import {
	contentResource,
	entitlements,
	organizationMemberships,
} from '@/db/schema'
import { getAllUserEntitlements } from '@/lib/entitlements-query'
import { getTeamSubscriptionsForUser } from '@/lib/team-subscriptions'
import { getServerAuthSession } from '@/server/auth'
import { log } from '@/server/logger'
import { getSubscriberFromCookie } from '@/trpc/api/routers/ability'
import { subject } from '@casl/ability'
import { and, eq, gt, inArray, isNull, or, sql } from 'drizzle-orm'

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

	// Load ALL active entitlements for the user across all their organizations
	// This ensures subscription/workshop entitlements work regardless of which
	// organization context the user is in
	const activeEntitlements = session?.user?.id
		? await getAllUserEntitlements(session.user.id)
		: []

	// Get team subscriptions owned by the user for seat management
	const teamSubscriptions = session?.user?.id
		? await getTeamSubscriptionsForUser(session.user.id)
		: []

	// Convert to seat info format for ability checks
	const teamSubscriptionSeats = teamSubscriptions.map((ts) => ({
		subscriptionId: ts.subscription.id,
		totalSeats: ts.seats.total,
		usedSeats: ts.seats.used,
	}))

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
		teamSubscriptions: teamSubscriptionSeats,
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
