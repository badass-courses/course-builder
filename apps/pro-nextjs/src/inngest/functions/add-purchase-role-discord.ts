import { db } from '@/db'
import { accounts, users } from '@/db/schema'
import { env } from '@/env.mjs'
import { inngest } from '@/inngest/inngest.server'
import { DiscordError, DiscordMember } from '@/lib/discord'
import { fetchAsDiscordBot, fetchJsonAsDiscordBot } from '@/lib/discord-query'
import { and, eq } from 'drizzle-orm'

import { NEW_PURCHASE_CREATED_EVENT } from '@coursebuilder/core/inngest/commerce/event-new-purchase-created'

export const addPurchaseRoleDiscord = inngest.createFunction(
	{
		id: `add-purchase-role-discord`,
		name: 'Add Purchase Role Discord',
	},
	{ event: NEW_PURCHASE_CREATED_EVENT },
	async ({ event, step }) => {
		const user = await step.run('get user', async () => {
			return db.query.users.findFirst({
				where: eq(users.id, event.user.id),
				with: {
					accounts: true,
					purchases: true,
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

			if (
				'user' in discordMember &&
				!discordMember.roles.includes(env.DISCORD_PURCHASER_ROLE_ID)
			) {
				await step.run('update basic discord roles for user', async () => {
					return await fetchAsDiscordBot(
						`guilds/${env.DISCORD_GUILD_ID}/members/${discordMember.user.id}`,
						{
							method: 'PATCH',
							body: JSON.stringify({
								roles: Array.from(
									new Set([
										...discordMember.roles,
										env.DISCORD_PURCHASER_ROLE_ID,
									]),
								),
							}),
							headers: {
								'Content-Type': 'application/json',
							},
						},
					)
				})
			}

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
