import { db } from '@/db'
import {
	accounts as accountsTable,
	contentResource,
	contentResourceProduct,
	contentResourceResource,
	entitlements as entitlementsTable,
	entitlementTypes,
	organizationMemberships,
} from '@/db/schema'
import { env } from '@/env.mjs'
import { and, asc, eq, gt, isNull, or, sql } from 'drizzle-orm'
import { v4 as uuidv4 } from 'uuid'

import type { User } from '@coursebuilder/core/schemas'

import { CohortAccess, CohortSchema, OfficeHourEvent } from './cohort'
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

	// Filter out event type resources from the main resources list
	// Events (office hours) should be handled separately
	if (cohortData && cohortData.resources) {
		cohortData.resources = cohortData.resources.filter(
			(r) => r.resource?.type !== 'event',
		)
	}

	const parsedCohort = CohortSchema.safeParse(cohortData)
	if (!parsedCohort.success) {
		console.error('Error parsing cohort:', {
			errors: parsedCohort.error.errors,
			data: cohortData,
		})
		return null
	}

	// Always fetch office hour events for cohorts
	try {
		const officeHourEvents = await getOfficeHourEvents(parsedCohort.data.id)

		// Initialize officeHours if not present
		if (!parsedCohort.data.fields.officeHours) {
			parsedCohort.data.fields.officeHours = {
				enabled: officeHourEvents.length > 0,
				events: [],
			}
		}

		// Merge the events into the cohort data
		parsedCohort.data.fields.officeHours.events = officeHourEvents
	} catch (error) {
		console.error('Failed to fetch office hour events:', error)
		// Don't fail the whole request if office hours can't be loaded
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

/**
 * Create office hour events for a cohort
 * @param cohortId - The ID of the cohort to create events for
 * @param events - Array of office hour events to create
 * @returns Array of created event IDs
 */
export async function createOfficeHourEvents(
	cohortId: string,
	events: OfficeHourEvent[],
): Promise<string[]> {
	try {
		// Get the cohort and its associated product
		const cohort = await db.query.contentResource.findFirst({
			where: eq(contentResource.id, cohortId),
			with: {
				resourceProducts: {
					with: {
						product: true,
					},
				},
			},
		})

		if (!cohort) {
			throw new Error(`Cohort not found: ${cohortId}`)
		}

		const createdEventIds: string[] = []

		for (const event of events) {
			// Create event as a contentResource
			const eventId = uuidv4()

			await db.insert(contentResource).values({
				id: eventId,
				type: 'event',
				fields: {
					title: event.title,
					description: event.description || '',
					slug: `${cohort.fields.slug}-office-hours-${event.id}`,
					state: 'published',
					visibility: 'unlisted',
					startsAt: event.startsAt,
					endsAt: event.endsAt,
					timezone: cohort.fields.timezone || 'America/Los_Angeles',
					attendeeInstructions: event.attendeeInstructions || '',
					status: event.status,
				},
				createdById: cohort.createdById,
				updatedById: cohort.updatedById,
			})

			// Link event to cohort via contentResourceResource
			await db.insert(contentResourceResource).values({
				resourceOfId: cohortId,
				resourceId: eventId,
				position: 0, // Office hours don't need specific ordering
			})

			// Associate event with cohort's product(s) if they exist
			for (const resourceProduct of cohort.resourceProducts) {
				await db.insert(contentResourceProduct).values({
					productId: resourceProduct.productId,
					resourceId: eventId,
					position: 0,
				})
			}

			createdEventIds.push(eventId)
		}

		return createdEventIds
	} catch (error) {
		console.error('Failed to create office hour events:', error)
		throw new Error(`Failed to create office hour events: ${error.message}`)
	}
}

/**
 * Update an existing office hour event
 * @param eventId - The ID of the event to update
 * @param updates - Partial event data to update
 */
export async function updateOfficeHourEvent(
	eventId: string,
	updates: Partial<OfficeHourEvent>,
): Promise<void> {
	try {
		const existingEvent = await db.query.contentResource.findFirst({
			where: and(
				eq(contentResource.id, eventId),
				eq(contentResource.type, 'event'),
			),
		})

		if (!existingEvent) {
			throw new Error(`Event not found: ${eventId}`)
		}

		const updatedFields = {
			...existingEvent.fields,
			...(updates.title && { title: updates.title }),
			...(updates.description && { description: updates.description }),
			...(updates.startsAt && { startsAt: updates.startsAt }),
			...(updates.endsAt && { endsAt: updates.endsAt }),
			...(updates.attendeeInstructions && {
				attendeeInstructions: updates.attendeeInstructions,
			}),
			...(updates.status && { status: updates.status }),
		}

		await db
			.update(contentResource)
			.set({
				fields: updatedFields,
				updatedAt: new Date(),
			})
			.where(eq(contentResource.id, eventId))
	} catch (error) {
		console.error('Failed to update office hour event:', error)
		throw new Error(`Failed to update office hour event: ${error.message}`)
	}
}

/**
 * Delete an office hour event
 * @param cohortId - The ID of the cohort the event belongs to
 * @param eventId - The ID of the event to delete
 */
export async function deleteOfficeHourEvent(
	cohortId: string,
	eventId: string,
): Promise<void> {
	try {
		// Verify the event belongs to the cohort
		const relationship = await db.query.contentResourceResource.findFirst({
			where: and(
				eq(contentResourceResource.resourceOfId, cohortId),
				eq(contentResourceResource.resourceId, eventId),
			),
		})

		if (!relationship) {
			throw new Error(`Event ${eventId} not found in cohort ${cohortId}`)
		}

		// Remove event-product associations
		await db
			.delete(contentResourceProduct)
			.where(eq(contentResourceProduct.resourceId, eventId))

		// Remove cohort-event relationship
		await db
			.delete(contentResourceResource)
			.where(
				and(
					eq(contentResourceResource.resourceOfId, cohortId),
					eq(contentResourceResource.resourceId, eventId),
				),
			)

		// Delete the event itself
		await db
			.delete(contentResource)
			.where(
				and(eq(contentResource.id, eventId), eq(contentResource.type, 'event')),
			)
	} catch (error) {
		console.error('Failed to delete office hour event:', error)
		throw new Error(`Failed to delete office hour event: ${error.message}`)
	}
}

/**
 * Get all office hour events for a cohort
 * @param cohortId - The ID of the cohort to get events for
 * @returns Array of office hour events
 */
export async function getOfficeHourEvents(
	cohortId: string,
): Promise<OfficeHourEvent[]> {
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
					eq(contentResource.type, 'event'),
					eq(contentResourceResource.resourceOfId, cohortId),
				),
			)
			.orderBy(asc(sql`JSON_EXTRACT(${contentResource.fields}, "$.startsAt")`))

		return results.map((r) => {
			const event = r.ContentResource
			return {
				id: event.id,
				title: event.fields.title || '',
				startsAt: event.fields.startsAt || '',
				endsAt: event.fields.endsAt || '',
				description: event.fields.description || '',
				attendeeInstructions: event.fields.attendeeInstructions || '',
				status: event.fields.status || 'draft',
			} as OfficeHourEvent
		})
	} catch (error) {
		console.error('Failed to get office hour events:', error)
		throw new Error(`Failed to get office hour events: ${error.message}`)
	}
}

/**
 * Enable office hours for a cohort
 * @param cohortId - The ID of the cohort to enable office hours for
 */
export async function enableCohortOfficeHours(cohortId: string): Promise<void> {
	try {
		const cohort = await db.query.contentResource.findFirst({
			where: eq(contentResource.id, cohortId),
		})

		if (!cohort) {
			throw new Error(`Cohort not found: ${cohortId}`)
		}

		// Update the cohort fields to enable office hours
		const updatedFields = {
			...cohort.fields,
			officeHours: {
				...(cohort.fields?.officeHours || {}),
				enabled: true,
			},
		}

		await db
			.update(contentResource)
			.set({
				fields: updatedFields,
				updatedAt: new Date(),
			})
			.where(eq(contentResource.id, cohortId))
	} catch (error) {
		console.error('Failed to enable office hours:', error)
		throw new Error(`Failed to enable office hours: ${error.message}`)
	}
}
