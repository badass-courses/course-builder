import { env } from '@/env.mjs'
import { inngest } from '@/inngest/inngest.server'
import { DiscordError, DiscordMember } from '@/lib/discord'
import {
	fetchAsDiscordBot,
	fetchJsonAsDiscordBot,
	getDiscordAccount,
} from '@/lib/discord-query'

import { PURCHASE_STATUS_UPDATED_EVENT } from '@coursebuilder/core/inngest/commerce/event-purchase-status-updated'

export const removePurchaseRoleDiscord = inngest.createFunction(
	{ id: `remove-purchase-role-discord`, name: 'Remove Purchase Role Discord' },
	{
		event: PURCHASE_STATUS_UPDATED_EVENT,
		if: 'event.data.status == "Refunded" || event.data.status == "Disputed" || event.data.status == "Banned"',
	},
	async ({ event, step, db: adapter }) => {
		const purchase = await step.run('get purchase', async () => {
			return adapter.getPurchaseForStripeCharge(event.data.stripeChargeId)
		})

		if (!purchase || !purchase.userId) throw new Error('No purchase found')
		if (!purchase.userId) throw new Error('No user')

		const user = await step.run('get user', async () => {
			return adapter.getUserById(purchase.userId as string)
		})

		if (!user) throw new Error('No user found')

		const discordAccount = await step.run(
			'check if discord is connected',
			async () => {
				return getDiscordAccount(user.id)
			},
		)

		if (discordAccount) {
			let discordMember = await step.run('get discord member', async () => {
				return await fetchJsonAsDiscordBot<DiscordMember | DiscordError>(
					`guilds/${env.DISCORD_GUILD_ID}/members/${discordAccount.providerAccountId}`,
				)
			})

			await step.run('remove purchaser role from discord', async () => {
				if ('user' in discordMember) {
					const roles = Array.from(
						new Set([
							...discordMember.roles.filter(
								(role) => role !== env.DISCORD_MEMBER_ROLE_ID,
							),
						]),
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
	},
)
