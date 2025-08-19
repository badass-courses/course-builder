import { UserSchema } from '@/ability'
import { db } from '@/db'
import { accounts, entitlements, entitlementTypes, users } from '@/db/schema'
import { env } from '@/env.mjs'
import { OAUTH_PROVIDER_ACCOUNT_LINKED_EVENT } from '@/inngest/events/oauth-provider-account-linked'
import { inngest } from '@/inngest/inngest.server'
import { DiscordError, DiscordMember } from '@/lib/discord'
import { fetchAsDiscordBot, fetchJsonAsDiscordBot } from '@/lib/discord-query'
import { getSubscriptionStatus } from '@/lib/subscriptions'
import { and, eq } from 'drizzle-orm'

export const discordAccountLinked = inngest.createFunction(
	{
		id: `discord-account-linked`,
		name: 'Discord Account Linked',
	},
	{
		event: OAUTH_PROVIDER_ACCOUNT_LINKED_EVENT,
		if: 'event.data.account.provider == "discord"',
	},
	async ({ event, step }) => {
		const { account, profile } = event.data

		const user = await step.run('get user', async () => {
			return await db.query.users.findFirst({
				where: eq(users.id, event.user.id),
				with: {
					accounts: true,
					purchases: true,
				},
			})
		})

		if (!user) throw new Error('No user found')

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

		await step.sleep('give discord a moment', '10s')

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

			const cohortDiscordRoleEntitlementType = await step.run(
				`get cohort discord role entitlement type`,
				async () => {
					return await db.query.entitlementTypes.findFirst({
						where: eq(entitlementTypes.name, 'cohort_discord_role'),
					})
				},
			)

			const userDiscordEntitlements = await step.run(
				'get user discord entitlements',
				async () => {
					if (!cohortDiscordRoleEntitlementType) {
						return []
					}

					return db.query.entitlements.findMany({
						where: and(
							eq(entitlements.userId, user.id),
							eq(
								entitlements.entitlementType,
								cohortDiscordRoleEntitlementType.id,
							),
						),
					})
				},
			)

			await step.run('update basic discord roles for user', async () => {
				if ('user' in discordMember) {
					const discordIds = userDiscordEntitlements.map(
						(entitlement) => entitlement.metadata?.discordRoleId,
					)

					const roles = Array.from(
						new Set([...discordMember.roles, ...discordIds]),
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

			return {
				account,
				profile,
				user: event.user,
				discordMember,
			}
		}

		return 'no discord account found for user'
	},
)
