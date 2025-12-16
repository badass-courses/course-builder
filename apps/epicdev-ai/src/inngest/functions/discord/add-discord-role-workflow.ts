import { db } from '@/db'
import { accounts, users } from '@/db/schema'
import { env } from '@/env.mjs'
import { inngest } from '@/inngest/inngest.server'
import { DiscordError, DiscordMember } from '@/lib/discord'
import { fetchAsDiscordBot, fetchJsonAsDiscordBot } from '@/lib/discord-query'
import { log } from '@/server/logger'
import { and, eq } from 'drizzle-orm'
import { z } from 'zod'

// Re-export existing event constants and schemas for backwards compatibility
export const USER_ADDED_TO_COHORT_EVENT = 'cohort/user-added'
export const USER_ADDED_TO_WORKSHOP_EVENT = 'workshop/user-added'

export const UserAddedToCohortEventSchema = z.object({
	cohortId: z.string(),
	userId: z.string(),
	discordRoleId: z.string().optional(),
})

export const UserAddedToWorkshopEventSchema = z.object({
	workshopId: z.string(),
	userId: z.string(),
	discordRoleId: z.string().optional(),
})

export type UserAddedToCohortEvent = z.infer<
	typeof UserAddedToCohortEventSchema
>
export type UserAddedToWorkshopEvent = z.infer<
	typeof UserAddedToWorkshopEventSchema
>

// Union type for event handling
type DiscordRoleEvent =
	| { name: 'cohort/user-added'; data: UserAddedToCohortEvent }
	| { name: 'workshop/user-added'; data: UserAddedToWorkshopEvent }

// Configuration for event-specific behavior
const DISCORD_EVENT_CONFIG = {
	'cohort/user-added': {
		logPrefix: 'cohort',
	},
	'workshop/user-added': {
		logPrefix: 'workshop',
	},
} as const

/**
 * Extract event details from either cohort or workshop events
 */
const getEventDetails = (event: DiscordRoleEvent) => {
	const eventName = event.name
	const eventData = event.data

	const hasCohortId = 'cohortId' in eventData
	const hasWorkshopId = 'workshopId' in eventData

	const eventType = hasCohortId
		? 'cohort'
		: hasWorkshopId
			? 'workshop'
			: 'unknown'

	return {
		userId: eventData.userId,
		discordRoleId: eventData.discordRoleId,
		eventType: eventType as 'cohort' | 'workshop',
		resourceId: hasCohortId
			? (eventData as UserAddedToCohortEvent).cohortId
			: hasWorkshopId
				? (eventData as UserAddedToWorkshopEvent).workshopId
				: null,
		originalEventName: eventName,
	}
}

/**
 * Resolve Discord role IDs to assign
 */
const resolveDiscordRoleId = (providedRoleId: string | undefined): string[] => {
	// Both cohort and workshop events work identically - simple role append
	return providedRoleId ? [providedRoleId] : []
}

/**
 * Update Discord roles for a user
 */
const updateDiscordRoles = async (
	step: any,
	discordAccountData: any,
	newRoleIds: string[],
) => {
	const providerAccountId =
		discordAccountData?.account?.providerAccountId ||
		discordAccountData?.providerAccountId

	if (newRoleIds.length === 0) {
		const errorMsg = 'No roles to assign'
		await log.warn('discord_role_update_skipped', {
			reason: errorMsg,
			discordProviderAccountId: providerAccountId,
		})
		return {
			success: false,
			error: errorMsg,
			discordProviderAccountId: providerAccountId,
		}
	}

	let discordMember = await step.run('get discord member', async () => {
		try {
			const member = await fetchJsonAsDiscordBot<DiscordMember | DiscordError>(
				`guilds/${env.DISCORD_GUILD_ID}/members/${providerAccountId}`,
			)

			if ('code' in member) {
				return {
					success: false,
					error: 'Discord API error',
					errorCode: member.code,
					message: member.message,
					discordProviderAccountId: providerAccountId,
				}
			}

			return {
				success: true,
				discordProviderAccountId: providerAccountId,
				currentRoles: member.roles || [],
				currentRolesCount: member.roles?.length || 0,
				member: member,
			}
		} catch (error) {
			await log.error('discord_role_update_member_fetch_failed', {
				discordProviderAccountId: providerAccountId,
				error: error instanceof Error ? error.message : String(error),
			})
			return {
				success: false,
				error: error instanceof Error ? error.message : String(error),
				discordProviderAccountId: providerAccountId,
			}
		}
	})

	const updateResult = await step.run(
		'update discord roles for user',
		async () => {
			if (
				discordMember &&
				typeof discordMember === 'object' &&
				'success' in discordMember &&
				discordMember.success
			) {
				const currentRoles = discordMember.currentRoles || []
				const roles = Array.from(new Set([...currentRoles, ...newRoleIds]))
				const rolesToAdd = newRoleIds.filter((id) => !currentRoles.includes(id))

				try {
					await fetchAsDiscordBot(
						`guilds/${env.DISCORD_GUILD_ID}/members/${providerAccountId}`,
						{
							method: 'PATCH',
							body: JSON.stringify({ roles }),
							headers: { 'Content-Type': 'application/json' },
						},
					)

					return {
						success: true,
						discordProviderAccountId: providerAccountId,
						rolesToAdd,
						rolesToAddCount: rolesToAdd.length,
						currentRolesCount: currentRoles.length,
						finalRolesCount: roles.length,
						finalRoles: roles,
					}
				} catch (error) {
					await log.error('discord_role_update_failed', {
						discordProviderAccountId: providerAccountId,
						rolesToAdd,
						error: error instanceof Error ? error.message : String(error),
					})
					return {
						success: false,
						error: error instanceof Error ? error.message : String(error),
						discordProviderAccountId: providerAccountId,
						rolesToAdd,
					}
				}
			} else {
				const errorMsg = 'Discord member not found or error fetching member'
				await log.error('discord_role_update_failed', {
					discordProviderAccountId: providerAccountId,
					reason: errorMsg,
					discordMemberError: discordMember,
				})
				return {
					success: false,
					error: errorMsg,
					discordProviderAccountId: providerAccountId,
					discordMemberCheck: discordMember,
				}
			}
		},
	)

	const verifiedMember = await step.run('reload discord member', async () => {
		try {
			const member = await fetchJsonAsDiscordBot<DiscordMember | DiscordError>(
				`guilds/${env.DISCORD_GUILD_ID}/members/${providerAccountId}`,
			)

			if ('code' in member) {
				return {
					success: false,
					error: 'Discord API error on verification',
					errorCode: member.code,
					message: member.message,
				}
			}

			const hasNewRoles = newRoleIds.every((id) => member.roles.includes(id))

			return {
				success: true,
				finalRoles: member.roles,
				finalRolesCount: member.roles.length,
				hasNewRoles,
				newRoleIds,
				allRolesAssigned: hasNewRoles,
			}
		} catch (error) {
			await log.error('discord_role_update_reload_failed', {
				discordProviderAccountId: providerAccountId,
				error: error instanceof Error ? error.message : String(error),
			})
			return {
				success: false,
				error: error instanceof Error ? error.message : String(error),
			}
		}
	})

	return {
		updateResult,
		verifiedMember,
		discordProviderAccountId: providerAccountId,
	}
}

/**
 * Unified Discord Role Assignment Workflow
 * Handles both cohort and workshop Discord role assignments
 */
export const addDiscordRoleWorkflow = inngest.createFunction(
	{
		id: `add-discord-role-workflow`,
		name: `Add Discord Role Workflow`,
	},
	[
		{ event: USER_ADDED_TO_COHORT_EVENT },
		{ event: USER_ADDED_TO_WORKSHOP_EVENT },
	],
	async ({ event, step }) => {
		// Extract event details
		const eventDetails = getEventDetails(event as DiscordRoleEvent)
		const { userId, discordRoleId, eventType, resourceId, originalEventName } =
			eventDetails
		const config =
			DISCORD_EVENT_CONFIG[
				`${eventType}/user-added` as keyof typeof DISCORD_EVENT_CONFIG
			]

		// Early exit if no Discord role ID provided
		if (!discordRoleId) {
			const errorMsg = 'No discord role id found'
			await log.warn('discord_role_workflow_skipped', {
				userId,
				eventName: event.name,
				reason: errorMsg,
				eventData: event.data,
			})
			return {
				success: false,
				error: errorMsg,
				userId,
				eventName: event.name,
				eventType,
				resourceId,
			}
		}

		// Get user with accounts
		const user = await step.run('get user', async () => {
			const foundUser = await db.query.users.findFirst({
				where: eq(users.id, userId),
				with: {
					accounts: true,
				},
			})

			if (!foundUser) {
				return {
					found: false,
					userId,
					error: 'User not found',
				}
			}

			return {
				found: true,
				user: {
					id: foundUser.id,
					email: foundUser.email,
					name: foundUser.name,
				},
				accountCount: foundUser.accounts?.length || 0,
				accountProviders: foundUser.accounts?.map((a) => a.provider) || [],
			}
		})

		if (!user || (typeof user === 'object' && 'found' in user && !user.found)) {
			const errorMsg = 'No user found'
			await log.error('discord_role_workflow_failed', {
				userId,
				reason: errorMsg,
			})
			throw new Error(errorMsg)
		}

		const userData =
			typeof user === 'object' && 'user' in user ? user.user : user

		if (!userData || 'error' in userData) {
			const errorMsg =
				'error' in userData ? userData.error : 'User data is invalid'
			await log.error('discord_role_workflow_failed', {
				userId: 'error' in userData ? userData.userId : null,
				reason: errorMsg,
			})
			throw new Error(errorMsg)
		}

		// Check for Discord account connection
		const discordAccount = await step.run(
			'check if discord is connected',
			async () => {
				const account = await db.query.accounts.findFirst({
					where: and(
						eq(accounts.userId, userData.id),
						eq(accounts.provider, 'discord'),
					),
				})

				if (!account) {
					return {
						found: false,
						userId: userData.id,
						userEmail: userData.email,
					}
				}

				return {
					found: true,
					account: {
						providerAccountId: account.providerAccountId,
						provider: account.provider,
					},
					userId: userData.id,
					userEmail: userData.email,
				}
			},
		)

		if (
			discordAccount &&
			typeof discordAccount === 'object' &&
			'found' in discordAccount &&
			discordAccount.found
		) {
			// Resolve role IDs to assign
			const roleIds = resolveDiscordRoleId(discordRoleId)

			if (roleIds.length === 0) {
				const errorMsg = 'No role IDs resolved to assign'
				await log.warn('discord_role_workflow_skipped', {
					userId: userData.id,
					reason: errorMsg,
					discordRoleId,
				})
				return {
					success: false,
					error: errorMsg,
					userId: userData.id,
					discordRoleId,
					roleIds: [],
				}
			}

			// Update Discord roles
			const result = await updateDiscordRoles(step, discordAccount, roleIds)

			return {
				success: true,
				userId: userData.id,
				userEmail: userData.email,
				discordRoleId,
				roleIds,
				discordProviderAccountId:
					'account' in discordAccount && discordAccount.account
						? discordAccount.account.providerAccountId
						: null,
				result,
			}
		}

		const errorMsg = 'No discord account found for user'
		const detailedMsg = `User ${userData.email} (${userData.id}) does not have a Discord account connected. They need to connect their Discord account before the role can be assigned.`

		await log.warn('discord_role_workflow_skipped', {
			userId: userData.id,
			userEmail: userData.email,
			reason: errorMsg,
			discordRoleId,
			message: detailedMsg,
		})

		return {
			success: false,
			error: errorMsg,
			message: detailedMsg,
			userId: userData.id,
			userEmail: userData.email,
			discordRoleId,
			actionRequired: 'User must connect Discord account via OAuth',
		}
	},
)

// Export legacy function names for backwards compatibility
export const addCohortRoleDiscord = addDiscordRoleWorkflow
export const addWorkshopRoleDiscord = addDiscordRoleWorkflow

// Export legacy event types for backwards compatibility
export type UserAddedToCohort = {
	name: typeof USER_ADDED_TO_COHORT_EVENT
	data: UserAddedToCohortEvent
}

export type UserAddedToWorkshop = {
	name: typeof USER_ADDED_TO_WORKSHOP_EVENT
	data: UserAddedToWorkshopEvent
}
