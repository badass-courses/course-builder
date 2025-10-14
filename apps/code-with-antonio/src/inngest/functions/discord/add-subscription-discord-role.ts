import { db } from '@/db'
import { accounts, users } from '@/db/schema'
import { env } from '@/env.mjs'
import { inngest } from '@/inngest/inngest.server'
import { DiscordError, DiscordMember } from '@/lib/discord'
import { fetchAsDiscordBot, fetchJsonAsDiscordBot } from '@/lib/discord-query'
import { getSubscriptionStatus } from '@/lib/subscriptions'
import { and, eq } from 'drizzle-orm'

import { NEW_SUBSCRIPTION_CREATED_EVENT } from '@coursebuilder/core/inngest/commerce/event-new-subscription-created'

export const addSubscriptionRoleDiscord = inngest.createFunction(
	{
		id: `add-subscription-role-discord`,
		name: 'Add Subscription Role Discord',
	},
	{ event: NEW_SUBSCRIPTION_CREATED_EVENT },
	async ({ event, step }) => {
		const user = await step.run('get user', async () => {
			return db.query.users.findFirst({
				where: eq(users.id, event.user.id),
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
					const { hasActiveSubscription } = await getSubscriptionStatus(user.id)
					const roles = Array.from(
						new Set([
							...discordMember.roles,
							...(hasActiveSubscription
								? [env.DISCORD_SUBSCRIBER_ROLE_ID]
								: []),
						]),
					)

					console.info('roles', { roles })

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
