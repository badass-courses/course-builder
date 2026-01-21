// App-specific implementation for coursebuilder
import { cache } from 'react'
import { unstable_cache } from 'next/cache'
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

import {
	ContentResourceSchema,
	type ContentResource,
} from '@coursebuilder/core/schemas'
// Import type without implementation
import { type AbilityForResource } from '@coursebuilder/utils-auth/current-ability-rules'

import { getResourceSection } from './get-resource-section'
import { getWorkshopResourceIds } from './get-workshop-resource-ids'

/**
 * Internal function to fetch resource from database.
 */
async function fetchGenericResourceFromDb(slugOrId: string) {
	// Try ID-based lookup first (uses index)
	let resource = await db.query.contentResource.findFirst({
		where: eq(contentResource.id, slugOrId),
		with: {
			resources: {
				with: {
					resource: {
						with: {
							resources: true,
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

	// If not found by ID, fall back to slug lookup (slow but necessary)
	if (!resource) {
		resource = await db.query.contentResource.findFirst({
			where: eq(
				sql`JSON_EXTRACT (${contentResource.fields}, "$.slug")`,
				slugOrId,
			),
			with: {
				resources: {
					with: {
						resource: {
							with: {
								resources: true,
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
	}

	return resource
}

/**
 * Fetches a minimal resource by slug or ID for ability checks.
 * Uses unstable_cache for cross-request caching (60s TTL).
 */
export const getGenericResource = async (slugOrId?: string | null) => {
	if (!slugOrId) {
		return null
	}

	const resource = await unstable_cache(
		() => fetchGenericResourceFromDb(slugOrId),
		['generic-resource', slugOrId],
		{ revalidate: 60, tags: [`resource:${slugOrId}`] },
	)()

	const parsedResource = ContentResourceSchema.safeParse(resource)
	return parsedResource.success ? parsedResource.data : null
}

/**
 * Internal implementation of ability rules fetching.
 * Uses a cache key based on primitive values for request-level deduplication.
 */
const getCurrentAbilityRulesImpl = cache(
	async function getCurrentAbilityRulesImplFn(
		resourceId: string | undefined,
		moduleId: string | undefined,
		orgId: string | undefined,
	) {
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
	},
)

/**
 * Fetches ability rules for a given resource and module context.
 * Cached per-request to prevent duplicate expensive database queries.
 */
export async function getCurrentAbilityRules({
	resourceId,
	moduleId,
	organizationId,
}: {
	resourceId?: string
	moduleId?: string
	organizationId?: string
}) {
	return getCurrentAbilityRulesImpl(resourceId, moduleId, organizationId)
}

type AbilityResult = Omit<AbilityForResource, 'canView'> & {
	canViewWorkshop: boolean
	canViewLesson: boolean
	isPendingOpenAccess: boolean
}

/**
 * Gets ability permissions for a specific resource within a module context.
 *
 * PERFORMANCE TIP: If you already have the module/resource fetched at the page level,
 * use getAbilityForResourceWithData() instead to avoid redundant database queries.
 *
 * Cached per-request to prevent duplicate database queries when called
 * multiple times (e.g., in page components, player containers, pricing).
 */
export const getAbilityForResource = cache(
	async function getAbilityForResourceImpl(
		resourceId: string | undefined,
		moduleId: string,
	): Promise<AbilityResult> {
		// Use ID-based lookup if we have IDs (much faster)
		const abilityRules = await getCurrentAbilityRules({
			resourceId,
			moduleId,
		})
		const moduleResource = await getGenericResource(moduleId)
		const resource = await getGenericResource(resourceId)

		return computeAbilityResult(abilityRules, moduleResource, resource)
	},
)

/**
 * Gets ability permissions using pre-fetched resources.
 * Use this when you already have the module/resource data to avoid redundant DB queries.
 *
 * @example
 * const workshop = await getCachedMinimalWorkshop(slug)
 * const ability = await getAbilityForResourceWithData({
 *   moduleId: workshop.id,
 *   moduleResource: workshop,
 * })
 */
export async function getAbilityForResourceWithData({
	resourceId,
	moduleId,
	moduleResource,
	resource,
}: {
	resourceId?: string
	moduleId: string
	moduleResource?: ContentResource | null
	resource?: ContentResource | null
}): Promise<AbilityResult> {
	const abilityRules = await getCurrentAbilityRules({
		resourceId,
		moduleId,
	})

	// Use provided resources or fetch if not provided
	const finalModule = moduleResource ?? (await getGenericResource(moduleId))
	const finalResource =
		resource ?? (resourceId ? await getGenericResource(resourceId) : null)

	return computeAbilityResult(abilityRules, finalModule, finalResource)
}

/**
 * Computes ability result from rules and resources.
 */
function computeAbilityResult(
	abilityRules: ReturnType<typeof defineRulesForPurchases> | undefined,
	moduleResource: ContentResource | null | undefined,
	resource: ContentResource | null | undefined,
): AbilityResult {
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
