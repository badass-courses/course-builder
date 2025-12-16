import { UserSchema } from '@/ability'
import { db } from '@/db'
import { accounts, entitlements, entitlementTypes, users } from '@/db/schema'
import { env } from '@/env.mjs'
import { ENTITLEMENT_CONFIG } from '@/inngest/config/product-types'
import { OAUTH_PROVIDER_ACCOUNT_LINKED_EVENT } from '@/inngest/events/oauth-provider-account-linked'
import { inngest } from '@/inngest/inngest.server'
import { DiscordError, DiscordMember } from '@/lib/discord'
import { fetchAsDiscordBot, fetchJsonAsDiscordBot } from '@/lib/discord-query'
import { getSubscriptionStatus } from '@/lib/subscriptions'
import { log } from '@/server/logger'
import { and, eq, inArray } from 'drizzle-orm'

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
						where: eq(
							entitlementTypes.name,
							ENTITLEMENT_CONFIG.cohort.discordRole,
						),
					})
				},
			)

			const workshopDiscordRoleEntitlementType = await step.run(
				`get workshop discord role entitlement type`,
				async () => {
					return await db.query.entitlementTypes.findFirst({
						where: eq(
							entitlementTypes.name,
							ENTITLEMENT_CONFIG['self-paced'].discordRole,
						),
					})
				},
			)

			const userDiscordEntitlements = await step.run(
				'get user discord entitlements',
				async () => {
					const entitlementTypeIds = [
						cohortDiscordRoleEntitlementType?.id,
						workshopDiscordRoleEntitlementType?.id,
					].filter(Boolean) as string[]

					if (entitlementTypeIds.length === 0) {
						return {
							found: false,
							entitlementCount: 0,
							entitlements: [],
							error: 'No Discord role entitlement types found in database',
							hasCohortType: !!cohortDiscordRoleEntitlementType,
							hasWorkshopType: !!workshopDiscordRoleEntitlementType,
						}
					}

					// Query for both cohort and workshop Discord role entitlements
					const foundEntitlements = await db.query.entitlements.findMany({
						where: and(
							eq(entitlements.userId, user.id),
							inArray(entitlements.entitlementType, entitlementTypeIds),
						),
					})

					const discordRoleIds = foundEntitlements
						.map((e) => e.metadata?.discordRoleId)
						.filter(Boolean)

					return {
						found: true,
						entitlementCount: foundEntitlements.length,
						entitlements: foundEntitlements.map((e) => ({
							id: e.id,
							entitlementType: e.entitlementType,
							metadata: e.metadata,
							discordRoleId: e.metadata?.discordRoleId,
						})),
						discordRoleIds,
						hasCohortType: !!cohortDiscordRoleEntitlementType,
						hasWorkshopType: !!workshopDiscordRoleEntitlementType,
					}
				},
			)

			const roleAssignmentResult = await step.run(
				'update basic discord roles for user',
				async () => {
					if ('user' in discordMember) {
						const entitlementsData =
							userDiscordEntitlements &&
							typeof userDiscordEntitlements === 'object' &&
							'found' in userDiscordEntitlements &&
							userDiscordEntitlements.found
								? userDiscordEntitlements.entitlements
								: []

						const discordIds = entitlementsData
							.map((entitlement) => entitlement?.discordRoleId)
							.filter(Boolean) as string[]

						if (discordIds.length === 0) {
							return {
								success: false,
								error: 'No roles to assign',
								userId: user.id,
								entitlementCount: entitlementsData.length,
								discordRoleIds: [],
							}
						}

						const currentRoles = discordMember.roles || []
						const roles = Array.from(new Set([...currentRoles, ...discordIds]))
						const rolesToAdd = discordIds.filter(
							(id) => !currentRoles.includes(id),
						)

						try {
							await fetchAsDiscordBot(
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

							return {
								success: true,
								userId: user.id,
								userEmail: user.email,
								rolesAssigned: discordIds,
								rolesToAdd,
								currentRolesCount: currentRoles.length,
								finalRolesCount: roles.length,
								entitlementCount: entitlementsData.length,
							}
						} catch (error) {
							await log.error('discord_account_linked_role_assignment_failed', {
								userId: user.id,
								error: error instanceof Error ? error.message : String(error),
							})
							return {
								success: false,
								error: error instanceof Error ? error.message : String(error),
								userId: user.id,
								rolesToAdd: discordIds,
							}
						}
					}

					await log.warn('discord_account_linked_member_not_found', {
						userId: user.id,
						discordProviderAccountId: discordAccount.providerAccountId,
					})
					return {
						success: false,
						error: 'Discord member not found',
						userId: user.id,
						discordProviderAccountId: discordAccount.providerAccountId,
					}
				},
			)

			const verifiedDiscordMember = await step.run(
				'reload discord member',
				async () => {
					const member = await fetchJsonAsDiscordBot<
						DiscordMember | DiscordError
					>(
						`guilds/${env.DISCORD_GUILD_ID}/members/${discordAccount.providerAccountId}`,
					)

					if ('code' in member) {
						return {
							success: false,
							error: 'Discord API error',
							errorCode: member.code,
							message: member.message,
						}
					}

					return {
						success: true,
						roles: member.roles,
						rolesCount: member.roles.length,
						member,
					}
				},
			)

			return {
				account,
				profile,
				user: event.user,
				entitlements: userDiscordEntitlements,
				roleAssignment: roleAssignmentResult,
				verifiedMember: verifiedDiscordMember,
			}
		}

		return 'no discord account found for user'
	},
)
