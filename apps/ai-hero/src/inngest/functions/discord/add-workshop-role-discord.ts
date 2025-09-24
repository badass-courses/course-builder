import { db } from '@/db'
import { accounts, users } from '@/db/schema'
import { env } from '@/env.mjs'
import { inngest } from '@/inngest/inngest.server'
import { DiscordError, DiscordMember } from '@/lib/discord'
import { fetchAsDiscordBot, fetchJsonAsDiscordBot } from '@/lib/discord-query'
import { and, eq } from 'drizzle-orm'
import { z } from 'zod'

export const USER_ADDED_TO_WORKSHOP_EVENT = 'workshop/user-added'

export type UserAddedToWorkshop = {
	name: typeof USER_ADDED_TO_WORKSHOP_EVENT
	data: UserAddedToWorkshopEvent
}

export const UserAddedToWorkshopEventSchema = z.object({
	workshopId: z.string(),
	userId: z.string(),
	discordRoleId: z.string().optional(),
})

export type UserAddedToWorkshopEvent = z.infer<
	typeof UserAddedToWorkshopEventSchema
>

export const addWorkshopRoleDiscord = inngest.createFunction(
	{
		id: `add-workshop-role-discord`,
		name: 'Add Workshop Role Discord',
	},
	{ event: USER_ADDED_TO_WORKSHOP_EVENT },
	async ({ event, step }) => {
		if (!event.data.discordRoleId) {
			return 'No discord role id found'
		}

		const user = await step.run('get user', async () => {
			return db.query.users.findFirst({
				where: eq(users.id, event.data.userId),
				with: {
					accounts: true,
				},
			})
		})

		if (!user) throw new Error('No user found')

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
			let discordMember = await step.run('get discord member', async () => {
				return await fetchJsonAsDiscordBot<DiscordMember | DiscordError>(
					`guilds/${env.DISCORD_GUILD_ID}/members/${discordAccount.providerAccountId}`,
				)
			})

			await step.run('update basic discord roles for user', async () => {
				if ('user' in discordMember) {
					const roles = Array.from(
						new Set([...discordMember.roles, event.data.discordRoleId]),
					)

					return await fetchAsDiscordBot(
						`guilds/${env.DISCORD_GUILD_ID}/members/${discordAccount.providerAccountId}`,
						{
							method: 'PATCH',
							body: JSON.stringify({
								roles,
							}),
							headers: {
								'Content-Type': 'application/json',
							},
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

		return 'No discord account found for user'
	},
)
