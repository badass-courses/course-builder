import type { NextRequest } from 'next/server'
import {
	createAppAbility,
	defineRulesForPurchases,
	getAbility,
} from '@/ability'
import { courseBuilderAdapter, db } from '@/db'
import { getLesson } from '@/lib/lessons/lessons.service'
import { getUserAbilityForRequest } from '@/server/ability-for-request'
import { getAbilityForWorkshop } from '@/utils/get-ability-for-workshop'
import { getWorkshopResourceIds } from '@/utils/get-workshop-resource-ids'

/**
 * Helper function to create proper ability rules with purchase-based access for a specific lesson
 */
export async function getAbilityForLessonById(
	request: NextRequest,
	lessonId: string,
) {
	const { user } = await getUserAbilityForRequest(request)

	if (!user) {
		return { user: null, ability: getAbility(), lesson: null }
	}

	// Get lesson with parent resources
	const basicAbility = getAbility({ user })
	const lesson = await getLesson(lessonId, basicAbility)
	if (!lesson) {
		return { user, ability: basicAbility, lesson: null }
	}

	// Find the parent workshop for this lesson
	const parentWorkshops = lesson.parentResources || []
	if (parentWorkshops.length === 0) {
		return { user, ability: basicAbility, lesson }
	}

	const workshopSlug = parentWorkshops[0]?.fields?.slug
	if (!workshopSlug) {
		return { user, ability: basicAbility, lesson }
	}

	// Use the workshop ability helper to get the proper ability with purchase rules
	const { ability: workshopAbility, workshop } = await getAbilityForWorkshop(
		request,
		workshopSlug,
	)

	if (!workshop) {
		return { user, ability: basicAbility, lesson }
	}

	// We need to rebuild ability rules with the lesson included for lesson-specific permissions

	const purchases = await courseBuilderAdapter.getPurchasesForUser(user.id)
	const allEntitlementTypes = await db.query.entitlementTypes.findMany()

	// Get all workshop resource IDs for ability rules

	const allModuleResourceIds = getWorkshopResourceIds(workshop)

	const abilityRules = defineRulesForPurchases({
		user,
		purchases,
		module: workshop,
		lesson,
		entitlementTypes: allEntitlementTypes,
		country: request.headers.get('x-vercel-ip-country') || 'US',
		allModuleResourceIds,
	})

	const ability = createAppAbility(abilityRules || [])

	return { user, ability, lesson }
}
