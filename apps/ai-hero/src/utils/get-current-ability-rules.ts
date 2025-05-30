// App-specific implementation for coursebuilder
import { headers } from 'next/headers'
import { createAppAbility, defineRulesForPurchases } from '@/ability'
import { courseBuilderAdapter, db } from '@/db'
import { entitlements, organizationMemberships } from '@/db/schema'
import { getLesson } from '@/lib/lessons-query'
import { getCachedMinimalWorkshop, getWorkshop } from '@/lib/workshops-query'
import { getServerAuthSession } from '@/server/auth'
import { getSubscriberFromCookie } from '@/trpc/api/routers/ability'
import { subject } from '@casl/ability'
import { and, eq, gt, isNull, or, sql } from 'drizzle-orm'

// Import type without implementation
import { type AbilityForResource } from '@coursebuilder/utils-auth/current-ability-rules'

import { getResourceSection } from './get-resource-section'

// Provide the actual implementation directly
export async function getCurrentAbilityRules({
	lessonId,
	moduleId,
	organizationId: orgId,
}: {
	lessonId?: string
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

	const lessonResource = lessonId && (await getLesson(lessonId))
	const moduleResource = moduleId ? await getWorkshop(moduleId) : null

	const sectionResource =
		lessonResource &&
		moduleResource &&
		(await getResourceSection(lessonResource.id, moduleResource))

	const purchases = await courseBuilderAdapter.getPurchasesForUser(
		session?.user?.id,
	)

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
		...(lessonResource && { lesson: lessonResource }),
		...(moduleResource && { module: moduleResource }),
		...(sectionResource ? { section: sectionResource } : {}),
		...(purchases && { purchases: purchases }),
	})
}

export async function getAbilityForResource(
	lessonId: string | undefined,
	moduleId: string,
): Promise<AbilityForResource> {
	const abilityRules = await getCurrentAbilityRules({
		lessonId,
		moduleId,
	})
	const workshop = await getCachedMinimalWorkshop(moduleId)

	const ability = createAppAbility(abilityRules || [])
	const canView = workshop
		? ability.can('read', subject('Content', { id: workshop.id }))
		: false
	const canInviteTeam = ability.can('read', 'Team')
	const isRegionRestricted = ability.can('read', 'RegionRestriction')
	const canCreate = ability.can('create', 'Content')

	return {
		canView,
		canInviteTeam,
		isRegionRestricted,
		canCreate,
	}
}

// Re-export the type for compatibility
export type { AbilityForResource }
