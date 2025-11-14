import { db } from '@/db'
import { accounts, users } from '@/db/schema'
import { env } from '@/env.mjs'
import { inngest } from '@/inngest/inngest.server'
import { DiscordError, DiscordMember } from '@/lib/discord'
import { fetchAsDiscordBot, fetchJsonAsDiscordBot } from '@/lib/discord-query'
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
	return {
		userId: event.data.userId,
		discordRoleId: event.data.discordRoleId,
		eventType: event.name.split('/')[0] as 'cohort' | 'workshop',
		resourceId:
			event.name === 'cohort/user-added'
				? (event.data as UserAddedToCohortEvent).cohortId
				: (event.data as UserAddedToWorkshopEvent).workshopId,
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
	discordAccount: any,
	newRoleIds: string[],
) => {
	if (newRoleIds.length === 0) {
		return 'No roles to assign'
	}

	let discordMember = await step.run('get discord member', async () => {
		return await fetchJsonAsDiscordBot<DiscordMember | DiscordError>(
			`guilds/${env.DISCORD_GUILD_ID}/members/${discordAccount.providerAccountId}`,
		)
	})

	await step.run('update discord roles for user', async () => {
		if ('user' in discordMember) {
			const roles = Array.from(new Set([...discordMember.roles, ...newRoleIds]))

			return await fetchAsDiscordBot(
				`guilds/${env.DISCORD_GUILD_ID}/members/${discordAccount.providerAccountId}`,
				{
					method: 'PATCH',
					body: JSON.stringify({ roles }),
					headers: { 'Content-Type': 'application/json' },
				},
			)
		}
		return null
	})

	discordMember = await step.run('reload discord member', async () => {
		return await fetchJsonAsDiscordBot<DiscordMember | DiscordError>(
			`guilds/${env.DISCORD_GUILD_ID}/members/${discordAccount.providerAccountId}`,
		)
	})

	return { discordMember }
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
		const { userId, discordRoleId, eventType } = eventDetails
		const config =
			DISCORD_EVENT_CONFIG[
				`${eventType}/user-added` as keyof typeof DISCORD_EVENT_CONFIG
			]

		// Early exit if no Discord role ID provided
		if (!discordRoleId) {
			return 'No discord role id found'
		}

		// Get user with accounts
		const user = await step.run('get user', async () => {
			return db.query.users.findFirst({
				where: eq(users.id, userId),
				with: {
					accounts: true,
				},
			})
		})

		if (!user) throw new Error('No user found')

		// Check for Discord account connection
		const discordAccount = await step.run(
			'check if discord is connected',
			async () => {
				return db.query.accounts.findFirst({
					where: and(
						eq(accounts.userId, user.id),
						eq(accounts.provider, 'discord'),
					),
				})
			},
		)

		if (discordAccount) {
			// Resolve role IDs to assign
			const roleIds = resolveDiscordRoleId(discordRoleId)

			// Update Discord roles
			const result = await updateDiscordRoles(step, discordAccount, roleIds)

			return result
		}

		return 'No discord account found for user'
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
