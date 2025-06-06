import { db } from '@/db'
import {
	accounts as accountsTable,
	contentResource,
	contentResourceResource,
	entitlements as entitlementsTable,
	entitlementTypes,
	organizationMemberships,
} from '@/db/schema'
import { env } from '@/env.mjs'
import { and, asc, eq, gt, isNull, or, sql } from 'drizzle-orm'

import type { User } from '@coursebuilder/core/schemas'

import { CohortAccess, CohortSchema } from './cohort'
import { WorkshopSchema } from './workshops'

export async function getCohort(cohortIdOrSlug: string) {
	const cohortData = await db.query.contentResource.findFirst({
		where: and(
			eq(contentResource.type, 'cohort'),
			or(
				eq(contentResource.id, cohortIdOrSlug),
				eq(
					sql`JSON_EXTRACT (${contentResource.fields}, "$.slug")`,
					cohortIdOrSlug,
				),
			),
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
								orderBy: [asc(contentResourceResource.position)],
							},
						},
					},
				},
				orderBy: [asc(contentResourceResource.position)],
			},
			resourceProducts: {
				with: {
					product: {
						with: {
							price: true,
						},
					},
				},
			},
		},
	})

	const parsedCohort = CohortSchema.safeParse(cohortData)
	if (!parsedCohort.success) {
		console.error('Error parsing cohort:', {
			errors: parsedCohort.error.errors,
			data: cohortData,
		})
		return null
	}

	return parsedCohort.data
}

/**
 * Get all modules in a cohort
 * @param cohortId - The ID of the cohort to get modules for
 * @returns An array of modules
 */
export async function getAllWorkshopsInCohort(cohortId: string) {
	try {
		const results = await db
			.select()
			.from(contentResourceResource)
			.innerJoin(
				contentResource,
				eq(contentResource.id, contentResourceResource.resourceId),
			)
			.where(
				and(
					eq(contentResource.type, 'workshop'),
					eq(contentResourceResource.resourceOfId, cohortId),
				),
			)
			.orderBy(asc(contentResourceResource.position))

		return results.map((r) => {
			const parsed = WorkshopSchema.safeParse(r.ContentResource)
			if (!parsed.success) {
				console.error(
					'Failed to parse workshop:',
					parsed.error,
					r.ContentResource,
				)
				throw new Error(`Invalid workshop data for cohort ${cohortId}`)
			}
			return parsed.data
		})
	} catch (error) {
		console.error('Failed to get workshops in cohort:', error)
		throw error
	}
}
/**
 * Check if a user has access to a cohort
 * @param organizationId - The ID of the organization to check cohort access for
 * @param userId - The ID of the user to check cohort access for
 * @param cohortSlug - The slug of the cohort to check access for
 * @returns The cohort access information if the user has access, null otherwise
 */
export async function checkCohortAccess(
	organizationId: string,
	userId: string,
	cohortSlug: string,
): Promise<CohortAccess | null> {
	// First, get the user's membership in the organization
	const membership = await db.query.organizationMemberships.findFirst({
		where: and(
			eq(organizationMemberships.organizationId, organizationId),
			eq(organizationMemberships.userId, userId),
		),
	})

	if (!membership) {
		return null // User is not a member of the organization
	}

	const cohortEntitlementType = await db.query.entitlementTypes.findFirst({
		where: eq(entitlementTypes.name, 'cohort_content_access'),
	})

	if (!cohortEntitlementType) {
		return null // Cohort entitlement type not found
	}

	const validEntitlements = await db.query.entitlements.findMany({
		where: and(
			eq(entitlementsTable.organizationMembershipId, membership.id), // Use membershipId
			eq(entitlementsTable.entitlementType, cohortEntitlementType.id),
			or(
				isNull(entitlementsTable.expiresAt),
				gt(entitlementsTable.expiresAt, sql`CURRENT_TIMESTAMP`),
			),
			isNull(entitlementsTable.deletedAt),
		),
	})

	const cohortEntitlement = validEntitlements.find(
		(e) => e.sourceType === 'cohort',
	)

	if (!cohortEntitlement || !cohortEntitlement.metadata) return null

	return {
		tier: cohortEntitlement.metadata.tier,
		contentIds: cohortEntitlement.metadata.contentIds,
		expiresAt: cohortEntitlement.expiresAt,
		discordRoleId: cohortEntitlement.metadata.discordRoleId,
	}
}

/**
 * Sync the Discord roles for a user
 * @param organizationId - The ID of the organization to sync the Discord roles for
 * @param user - The user to sync the Discord roles for
 */
export async function syncDiscordRoles(organizationId: string, user: User) {
	const accounts = await db.query.accounts.findMany({
		where: and(
			eq(accountsTable.userId, user.id),
			eq(accountsTable.provider, 'discord'),
		),
	})

	const discordAccount = accounts[0]
	if (!discordAccount?.access_token) return

	// Get the user's membership in the specified organization
	const membership = await db.query.organizationMemberships.findFirst({
		where: and(
			eq(organizationMemberships.organizationId, organizationId),
			eq(organizationMemberships.userId, user.id),
		),
	})

	if (!membership) {
		return // User is not a member of this organization
	}

	const entitlements = await db.query.entitlements.findMany({
		where: and(
			eq(entitlementsTable.organizationMembershipId, membership.id),
			eq(entitlementsTable.entitlementType, 'cohort_discord_role'),
			or(
				isNull(entitlementsTable.expiresAt),
				gt(entitlementsTable.expiresAt, sql`CURRENT_TIMESTAMP`),
			),
			isNull(entitlementsTable.deletedAt),
		),
	})

	try {
		const currentRoles = await fetchDiscordRoles(discordAccount.access_token)
		const requiredRoles = entitlements.flatMap((e) => e.metadata?.roleIds || [])

		for (const roleId of requiredRoles) {
			if (!currentRoles.includes(roleId)) {
				await addDiscordRole(discordAccount.access_token, roleId)
			}
		}
	} catch (error) {
		console.error('Failed to sync Discord roles:', error)
		throw new Error('Discord role sync failed')
	}
}

async function fetchDiscordRoles(accessToken: string): Promise<string[]> {
	const response = await fetch('https://discord.com/api/users/@me/guilds', {
		headers: { Authorization: `Bearer ${accessToken}` },
	})

	if (!response.ok) return []
	const guilds = await response.json()
	return guilds.flatMap((g: any) => g.roles || [])
}

/**
 * Add a Discord role to a user
 * @param accessToken - The access token for the user
 * @param roleId - The ID of the role to add
 */
async function addDiscordRole(accessToken: string, roleId: string) {
	await fetch(
		`https://discord.com/api/guilds/${env.DISCORD_GUILD_ID}/members/@me/roles/${roleId}`,
		{
			method: 'PUT',
			headers: {
				Authorization: `Bot ${env.DISCORD_BOT_TOKEN}`,
				'Content-Type': 'application/json',
			},
		},
	)
}
