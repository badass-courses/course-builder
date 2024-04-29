import { headers } from 'next/headers'
import { createAppAbility, defineRulesForPurchases } from '@/ability'
import { courseBuilderAdapter } from '@/db'
import { getLesson } from '@/lib/lessons-query'
import { getServerAuthSession } from '@/server/auth'
import { getSubscriberFromCookie } from '@/trpc/api/routers/ability'

import type { ContentResource } from '@coursebuilder/core/types'

export async function getCurrentAbilityRules({
	lessonId,
	moduleId,
}: {
	lessonId?: string
	moduleId?: string
}) {
	const headerStore = headers()
	const country =
		headerStore.get('x-vercel-ip-country') ||
		process.env.DEFAULT_COUNTRY ||
		'US'

	const convertkitSubscriber = await getSubscriberFromCookie()

	const { session } = await getServerAuthSession()

	const lessonResource = lessonId && (await getLesson(lessonId))
	const moduleResource = moduleId
		? await courseBuilderAdapter.getContentResource(moduleId)
		: null

	const sectionResource =
		lessonResource &&
		module &&
		(await getResourceSection(lessonResource.id, moduleResource))

	return defineRulesForPurchases({
		user: session?.user,
		...(convertkitSubscriber && {
			subscriber: convertkitSubscriber,
		}),
		country,
		...(lessonResource && { lesson: lessonResource }),
		...(moduleResource && { module: moduleResource }),
		...(sectionResource ? { section: sectionResource } : {}),
		isSolution: false,
		purchasedModules: [],
	})
}

async function getResourceSection(
	resourceId: string,
	moduleResource?: ContentResource | null,
) {
	if (!moduleResource?.resources) return null
	let sectionData = null

	moduleResource.resources.forEach((section) => {
		if (section.resourceId === resourceId) {
			sectionData = section.resource
		}

		section.resource.resources.forEach((lesson: { resourceId: string }) => {
			if (lesson.resourceId === resourceId) {
				sectionData = section.resource
			}
		})
	})

	return sectionData
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
