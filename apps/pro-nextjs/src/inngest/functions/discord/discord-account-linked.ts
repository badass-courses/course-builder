import { db } from '@/db'
import { users } from '@/db/schema'
import { env } from '@/env.mjs'
import { OAUTH_PROVIDER_ACCOUNT_LINKED_EVENT } from '@/inngest/events/oauth-provider-account-linked'
import { inngest } from '@/inngest/inngest.server'
import { DiscordError, DiscordMember } from '@/lib/discord'
import { fetchAsDiscordBot, fetchJsonAsDiscordBot } from '@/lib/discord-query'
import { eq } from 'drizzle-orm'

export const discordAccountLinked = inngest.createFunction(
	{
		id: `discord-account-linked`,
		name: 'Discord Account Linked',
		if: 'event.data.account.provider == "discord"',
	},
	{
		event: OAUTH_PROVIDER_ACCOUNT_LINKED_EVENT,
	},
	async ({ event, step }) => {
		const { account, profile } = event.data

		const user = await step.run('get user', async () => {
			return db.query.users.findFirst({
				where: eq(users.id, event.user.id),
				with: {
					accounts: true,
					purchases: true,
				},
			})
		})

		const discordUser = await step.run('get discord user', async () => {
			const userUrl = new URL('https://discord.com/api/users/@me')
			const userRes = await fetch(userUrl.toString(), {
				headers: {
					authorization: `Bearer ${account.access_token}`,
				},
			})
			return await userRes.json()
		})

		await step.run('add user to discord', async () => {
			return await fetchAsDiscordBot(
				`guilds/${env.DISCORD_GUILD_ID}/members/${discordUser.id}`,
				{
					method: 'PUT',
					body: JSON.stringify({ access_token: account.access_token }),
					headers: { 'Content-Type': 'application/json' },
				},
			)
		})

		await step.sleep('give discord a moment', 300)

		const discordMember = await step.run('get discord member', async () => {
			return await fetchJsonAsDiscordBot<DiscordMember | DiscordError>(
				`guilds/${env.DISCORD_GUILD_ID}/members/${discordUser.id}`,
			)
		})

		await step.run('update basic discord roles for user', async () => {
			if ('user' in discordMember) {
				const userHasPurchases =
					(user?.purchases?.filter(
						(purchase) =>
							purchase.status === 'Valid' || purchase.status === 'Restricted',
					).length || 0) > 0
				return await fetchAsDiscordBot(
					`guilds/${env.DISCORD_GUILD_ID}/members/${discordMember.user.id}`,
					{
						method: 'PATCH',
						body: JSON.stringify({
							roles: Array.from(
								new Set([
									...discordMember.roles,
									...(userHasPurchases ? [env.DISCORD_MEMBER_ROLE_ID] : []),
								]),
							),
						}),
						headers: {
							'Content-Type': 'application/json',
						},
					},
				)
			}
			return null
		})

		return {
			account,
			profile,
			user: event.user,
		}
	},
)
