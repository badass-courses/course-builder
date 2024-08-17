import { db } from '@/db'
import { users } from '@/db/schema'
import { env } from '@/env.mjs'
import { OAUTH_PROVIDER_ACCOUNT_LINKED_EVENT } from '@/inngest/events/oauth-provider-account-linked'
import { inngest } from '@/inngest/inngest.server'
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

		if ('user' in discordMember) {
			await step.run('update discord roles for user', async () => {
				const fullUser = await db.query.users.findFirst({
					where: (users, { eq }) => eq(users.id, event.user.id),
				})

				await db
					.update(users)
					.set({
						fields: {
							...(fullUser && fullUser.fields),
							discordMemberId: discordMember.user.id,
						},
					})
					.where(eq(users.id, event.user.id))

				if (!discordMember.roles.includes(env.DISCORD_MEMBER_ROLE_ID)) {
					await fetchAsDiscordBot(
						`guilds/${env.DISCORD_GUILD_ID}/members/${discordMember.user.id}`,
						{
							method: 'PATCH',
							body: JSON.stringify({
								roles: Array.from(
									new Set([...discordMember.roles, env.DISCORD_MEMBER_ROLE_ID]),
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
		}

		return {
			account,
			profile,
			user: event.user,
		}
	},
)

async function fetchJsonAsDiscordBot<JsonType = unknown>(
	endpoint: string,
	config?: RequestInit,
) {
	const res = await fetchAsDiscordBot(endpoint, {
		...config,
		headers: {
			'Content-Type': 'application/json',
			...config?.headers,
		},
	})
	return (await res.json()) as JsonType
}

async function fetchAsDiscordBot(endpoint: string, config?: RequestInit) {
	const url = new URL(`https://discord.com/api/${endpoint}`)
	return await fetch(url.toString(), {
		...config,
		headers: {
			Authorization: `Bot ${env.DISCORD_BOT_TOKEN}`,
			...config?.headers,
		},
	})
}
