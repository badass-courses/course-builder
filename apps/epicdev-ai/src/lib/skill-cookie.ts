import { courseBuilderAdapter, db } from '@/db'
import { contentResource, contentResourceProduct } from '@/db/schema'
import { getAllUserEntitlements } from '@/lib/entitlements-query'
import { eq, inArray, sql } from 'drizzle-orm'

/**
 * Gets all workshop slugs that a user has access to
 *
 * This includes:
 * - Free tutorials (all tutorials are free)
 * - Purchased workshops (via user's purchases)
 * - Workshops accessible via entitlements
 *
 * @param userId - The user ID to check access for
 * @returns Array of workshop/tutorial slugs the user can access
 */
export async function getUserAccessibleWorkshopSlugs(
	userId: string | undefined | null,
): Promise<string[]> {
	if (!userId) return []

	try {
		// Get all tutorials (tutorials are free content)
		const freeTutorials = await db.query.contentResource.findMany({
			where: eq(contentResource.type, 'tutorial'),
		})

		const freeTutorialSlugs = freeTutorials
			.map((tutorial) => {
				const fields = tutorial.fields as any
				return fields?.slug as string | undefined
			})
			.filter((slug): slug is string => Boolean(slug))

		// Get workshops accessible via entitlements
		const entitlements = await getAllUserEntitlements(userId)
		const entitlementWorkshopIds = new Set<string>()

		for (const entitlement of entitlements) {
			const contentIds = entitlement.metadata?.contentIds || []
			if (Array.isArray(contentIds)) {
				contentIds.forEach((id) => entitlementWorkshopIds.add(id))
			}
		}

		let entitlementWorkshopSlugs: string[] = []
		if (entitlementWorkshopIds.size > 0) {
			const entitlementWorkshops = await db.query.contentResource.findMany({
				where: inArray(contentResource.id, Array.from(entitlementWorkshopIds)),
			})

			entitlementWorkshopSlugs = entitlementWorkshops
				.filter(
					(resource) =>
						resource.type === 'workshop' || resource.type === 'tutorial',
				)
				.map((resource) => {
					const fields = resource.fields as any
					return fields?.slug as string | undefined
				})
				.filter((slug): slug is string => Boolean(slug))
		}

		// Combine and deduplicate
		const allSlugs = [
			...new Set([...freeTutorialSlugs, ...entitlementWorkshopSlugs]),
		]

		return allSlugs
	} catch (error) {
		console.error('Error getting user accessible workshop slugs:', error)
		return []
	}
}

/**
 * Creates a skill cookie value from workshop slugs
 *
 * @param slugs - Array of workshop slugs
 * @returns Comma-separated string of slugs
 */
export function createSkillCookieValue(slugs: string[]): string {
	return slugs.join(',')
}

/**
 * Parses a skill cookie value into workshop slugs
 *
 * @param cookieValue - The raw cookie value
 * @returns Array of workshop slugs
 */
export function parseSkillCookieValue(cookieValue: string): string[] {
	if (!cookieValue || cookieValue === '0') return []
	return cookieValue.split(',').filter(Boolean)
}

/**
 * Creates the Set-Cookie header value for the skill cookie
 *
 * @param value - The cookie value (comma-separated slugs)
 * @param domain - Optional domain for the cookie
 * @param options - Additional cookie options
 * @returns The full Set-Cookie header value
 */
export function createSkillCookieHeader(
	value: string,
	domain?: string,
	options?: {
		expires?: Date
		maxAge?: number
	},
): string {
	const parts = [`skill=${value}`, 'Path=/', 'SameSite=Lax']

	if (domain) {
		parts.push(`Domain=${domain}`)
	}

	if (options?.expires) {
		parts.push(`Expires=${options.expires.toUTCString()}`)
	} else if (options?.maxAge) {
		parts.push(`Max-Age=${options.maxAge}`)
	}

	// In production, always use Secure
	if (process.env.NODE_ENV === 'production') {
		parts.push('Secure')
	}

	return parts.join('; ')
}

/**
 * Creates an expired skill cookie header for logout
 *
 * @param domain - Optional domain for the cookie
 * @returns The Set-Cookie header value to expire the cookie
 */
export function createExpiredSkillCookieHeader(domain?: string): string {
	return createSkillCookieHeader('0', domain, {
		expires: new Date('1970-01-01'),
	})
}
