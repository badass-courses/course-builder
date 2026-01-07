import { env } from '@/env.mjs'
import { DiscordError, DiscordMember } from '@/lib/discord'
import {
	fetchAsDiscordBot,
	fetchJsonAsDiscordBot,
	getDiscordAccount,
} from '@/lib/discord-query'

/**
 * Removes a Discord role from a user
 * @param userId - The user ID to remove the role from
 * @param roleId - The Discord role ID to remove
 * @returns Object with status and details about the operation
 */
export async function removeDiscordRole(userId: string, roleId: string) {
	// Get Discord account for user
	const discordAccount = await getDiscordAccount(userId)

	if (!discordAccount) {
		return {
			status: 'skipped',
			reason: 'No Discord account found for user',
			userId,
		}
	}

	try {
		// Get current Discord member
		const discordMember = await fetchJsonAsDiscordBot<DiscordMember>(
			`guilds/${env.DISCORD_GUILD_ID}/members/${discordAccount.providerAccountId}`,
		)

		if (!discordMember) {
			return {
				status: 'skipped',
				reason: 'Discord member not found in guild',
				discordAccountId: discordAccount.providerAccountId,
				userId,
			}
		}

		// Check if user has the role
		const hasRole = discordMember.roles?.includes(roleId)

		if (!hasRole) {
			return {
				status: 'skipped',
				reason: 'User does not have role to remove',
				userId,
				discordAccountId: discordAccount.providerAccountId,
				roleId,
			}
		}

		// Remove the role from Discord
		await fetchAsDiscordBot(
			`guilds/${env.DISCORD_GUILD_ID}/members/${discordAccount.providerAccountId}/roles/${roleId}`,
			{
				method: 'DELETE',
			},
		)

		return {
			status: 'success',
			removedRoleId: roleId,
			discordAccountId: discordAccount.providerAccountId,
			userId,
		}
	} catch (error) {
		return {
			status: 'error',
			reason: error instanceof Error ? error.message : String(error),
			userId,
			discordAccountId: discordAccount.providerAccountId,
			roleId,
		}
	}
}
