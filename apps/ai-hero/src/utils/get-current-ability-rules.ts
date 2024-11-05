import { headers } from 'next/headers'
import { createAppAbility, defineRulesForPurchases } from '@/ability'
import { courseBuilderAdapter } from '@/db'
import { getLesson } from '@/lib/lessons-query'
import { Module } from '@/lib/module'
import { getModule } from '@/lib/modules-query'
import { getServerAuthSession } from '@/server/auth'
import { getSubscriberFromCookie } from '@/trpc/api/routers/ability'

import { getResourceSection } from './get-resource-section'

export async function getCurrentAbilityRules({
	lessonId,
	moduleId,
}: {
	lessonId?: string
	moduleId?: string
}) {
	const headerStore = await headers()
	const country =
		headerStore.get('x-vercel-ip-country') ||
		process.env.DEFAULT_COUNTRY ||
		'US'

	const convertkitSubscriber = await getSubscriberFromCookie()

	const { session } = await getServerAuthSession()

	const lessonResource = lessonId && (await getLesson(lessonId))
	const moduleResource = moduleId ? await getModule(moduleId) : null

	const sectionResource =
		lessonResource &&
		module &&
		(await getResourceSection(lessonResource.id, moduleResource))

	const purchases = await courseBuilderAdapter.getPurchasesForUser(
		session?.user?.id,
	)

	return defineRulesForPurchases({
		user: session?.user,
		country,
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

export async function getViewingAbilityForResource(
	lessonId: string,
	moduleId: string,
) {
	const abilityRules = await getCurrentAbilityRules({ lessonId, moduleId })
	const ability = createAppAbility(abilityRules || [])
	const canView = ability.can('read', 'Content')
	return canView
}

export type AbilityForResource = {
	canView: boolean
	canInviteTeam: boolean
	isRegionRestricted: boolean
}

export async function getAbilityForResource(
	lessonId: string,
	moduleId: string,
) {
	const abilityRules = await getCurrentAbilityRules({ lessonId, moduleId })
	const ability = createAppAbility(abilityRules || [])
	const canView = ability.can('read', 'Content')
	const canInviteTeam = ability.can('read', 'Team')
	const isRegionRestricted = ability.can('read', 'RegionRestriction')

	return {
		canView,
		canInviteTeam,
		isRegionRestricted,
	}
}
