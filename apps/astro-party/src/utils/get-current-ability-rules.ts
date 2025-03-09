// App-specific implementation for coursebuilder
import { headers } from 'next/headers'
import { createAppAbility, defineRulesForPurchases } from '@/ability'
import { courseBuilderAdapter } from '@/db'
import { getLesson } from '@/lib/lessons-query'
import { Module } from '@/lib/module'
import { getModule } from '@/lib/modules-query'
import { getServerAuthSession } from '@/server/auth'
import { getSubscriberFromCookie } from '@/trpc/api/routers/ability'

import { getResourceSection } from './get-resource-section'

// Re-export from the shared package
// This file exists for backward compatibility
export {
	getCurrentAbilityRules,
	getViewingAbilityForResource,
	getAbilityForResource,
	type AbilityForResource,
} from '@coursebuilder/utils-auth/current-ability-rules'

// Override the getCurrentAbilityRules function with the actual implementation
// This sets up the implementation that the package defines but doesn't implement
Object.defineProperty(exports, 'getCurrentAbilityRules', {
	value: async function ({
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
	},
})

// Override getViewingAbilityForResource with the actual implementation
Object.defineProperty(exports, 'getViewingAbilityForResource', {
	value: async function (lessonId: string, moduleId: string) {
		const abilityRules = await exports.getCurrentAbilityRules({
			lessonId,
			moduleId,
		})
		const ability = createAppAbility(abilityRules || [])
		const canView = ability.can('read', 'Content')
		return canView
	},
})

// Override getAbilityForResource with the actual implementation
Object.defineProperty(exports, 'getAbilityForResource', {
	value: async function (lessonId: string, moduleId: string) {
		const abilityRules = await exports.getCurrentAbilityRules({
			lessonId,
			moduleId,
		})
		const ability = createAppAbility(abilityRules || [])
		const canView = ability.can('read', 'Content')
		const canInviteTeam = ability.can('read', 'Team')
		const isRegionRestricted = ability.can('read', 'RegionRestriction')

		return {
			canView,
			canInviteTeam,
			isRegionRestricted,
		}
	},
})
