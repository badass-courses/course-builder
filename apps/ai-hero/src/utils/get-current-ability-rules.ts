// App-specific implementation for coursebuilder
import { headers } from 'next/headers'
import { createAppAbility, defineRulesForPurchases } from '@/ability'
import { courseBuilderAdapter, db } from '@/db'
import { entitlements, organizationMemberships } from '@/db/schema'
import { getSubscriberFromCookie } from '@/lib/convertkit'
import { getLesson } from '@/lib/lessons-query'
import { getCachedMinimalWorkshop, getWorkshop } from '@/lib/workshops-query'
import { getServerAuthSession } from '@/server/auth'
import { subject } from '@casl/ability'
import { and, eq, gt, isNull, or, sql } from 'drizzle-orm'

// Import type without implementation
import { type AbilityForResource } from '@coursebuilder/utils-auth/current-ability-rules'

import { getResourceSection } from './get-resource-section'
import { getWorkshopResourceIds } from './get-workshop-resource-ids'

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
		...(lessonResource && { lesson: lessonResource }),
		...(moduleResource && { module: moduleResource }),
		...(sectionResource ? { section: sectionResource } : {}),
		...(purchases && { purchases: purchases }),
		allModuleResourceIds,
	})
}

export async function getAbilityForResource(
	lessonId: string | undefined,
	moduleId: string,
): Promise<
	Omit<AbilityForResource, 'canView'> & {
		canViewWorkshop: boolean
		canViewLesson: boolean
		isPendingOpenAccess: boolean
	}
> {
	const abilityRules = await getCurrentAbilityRules({
		lessonId,
		moduleId,
	})
	const workshop = await getCachedMinimalWorkshop(moduleId)
	const lesson = lessonId ? await getLesson(lessonId) : null

	const ability = createAppAbility(abilityRules || [])

	const canViewWorkshop = workshop
		? ability.can('read', subject('Content', { id: workshop.id }))
		: false

	const canViewLesson = lesson?.id
		? ability.can('read', subject('Content', { id: lesson.id }))
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
