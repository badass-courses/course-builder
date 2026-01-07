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
import { subject } from '@casl/ability'

/**
 * Helper function to create proper ability rules with purchase-based access for a specific lesson
 * Checks all parent workshops and uses the first one the user has access to
 * @param request - The Next.js request
 * @param lessonId - The lesson ID or slug
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

	// Check ALL parent workshops to see if user has access to ANY of them
	const purchases = await courseBuilderAdapter.getPurchasesForUser(user.id)
	const allEntitlementTypes = await db.query.entitlementTypes.findMany()

	let workshop = null
	let abilityRules: ReturnType<typeof defineRulesForPurchases> = []
	let allModuleResourceIds: string[] = []

	for (const parentWorkshop of parentWorkshops) {
		const workshopSlug = parentWorkshop.fields?.slug
		if (!workshopSlug) {
			continue
		}

		try {
			// Use the workshop ability helper to get the proper ability with purchase rules
			const { ability: workshopAbility, workshop: foundWorkshop } =
				await getAbilityForWorkshop(request, workshopSlug)

			if (!foundWorkshop) {
				continue
			}

			// Get all workshop resource IDs for ability rules
			const moduleResourceIds = getWorkshopResourceIds(foundWorkshop)

			const rules = defineRulesForPurchases({
				user,
				purchases,
				module: foundWorkshop,
				lesson,
				entitlementTypes: allEntitlementTypes,
				country: request.headers.get('x-vercel-ip-country') || 'US',
				allModuleResourceIds: moduleResourceIds,
			})

			const testAbility = createAppAbility(rules || [])
			const canRead = testAbility.can(
				'read',
				subject('Content', { id: lesson.id }),
			)

			if (canRead) {
				workshop = foundWorkshop
				abilityRules = rules || []
				allModuleResourceIds = moduleResourceIds
				break
			}
		} catch (error) {
			console.error('Error getting ability for workshop', error)
			continue
		}
	}

	if (!workshop) {
		return { user, ability: basicAbility, lesson }
	}

	const ability = createAppAbility(abilityRules || [])

	return { user, ability, lesson }
}
