import { emailListProvider } from '@/coursebuilder/email-list-provider'
import { db } from '@/db'
import {
	accounts,
	purchases as purchasesTable,
	users as usersTable,
} from '@/db/schema'
import { inngest } from '@/inngest/inngest.server'
import { format } from 'date-fns'
import { and, eq, inArray } from 'drizzle-orm'
import { z } from 'zod'

export const SYNC_PURCHASE_TAGS_EVENT = 'purchase/sync-tags'

export type SyncPurchaseTags = {
	name: typeof SYNC_PURCHASE_TAGS_EVENT
	data: {}
}

export const syncPurchaseTags = inngest.createFunction(
	{ id: `sync-purchase-tags`, name: `Sync Purchase Tags` },
	{
		event: SYNC_PURCHASE_TAGS_EVENT,
	},
	async ({ event, step }) => {
		const validPurchases = await step.run('get purchases', async () => {
			return db.query.purchases.findMany({
				where: inArray(purchasesTable.status, ['Valid', 'Restricted']),
				with: {
					product: true,
				},
			})
		})

		for (const purchase of validPurchases) {
			const userId = purchase.userId

			if (!userId) continue

			const user = await step.run('get user', async () => {
				return db.query.users.findFirst({
					where: eq(usersTable.id, userId),
				})
			})

			if (!user) throw new Error('No user found')

			// const discordAccount = await step.run(
			// 	'check if discord is connected',
			// 	async () => {
			// 		return db.query.accounts.findFirst({
			// 			where: and(
			// 				eq(accounts.userId, user.id),
			// 				eq(accounts.provider, 'discord'),
			// 			),
			// 		})
			// 	},
			// )
			//
			// if (discordAccount) {
			// 	console.log('discord account is connected')
			// 	const DiscordMemberBasicSchema = z.object({
			// 		user: z.object({
			// 			id: z.string(),
			// 		}),
			// 		roles: z.array(z.string()),
			// 	})
			//
			// 	let discordMember = await step.run('get discord member', async () => {
			// 		return DiscordMemberBasicSchema.parse(
			// 			await fetchJsonAsDiscordBot<DiscordMember | DiscordError>(
			// 				`guilds/${env.DISCORD_GUILD_ID}/members/${discordAccount.providerAccountId}`,
			// 			),
			// 		)
			// 	})
			//
			// 	console.log('discord member', discordMember.user.id)
			//
			// 	await step.run('update basic discord roles for user', async () => {
			// 		console.log('updating discord roles', 'user' in discordMember)
			//
			// 		const roles = Array.from(
			// 			new Set([...discordMember.roles, env.DISCORD_MEMBER_ROLE_ID]),
			// 		)
			//
			// 		console.log('roles', { roles })
			//
			// 		return await fetchJsonAsDiscordBot(
			// 			`guilds/${env.DISCORD_GUILD_ID}/members/${discordMember.user.id}`,
			// 			{
			// 				method: 'PATCH',
			// 				body: JSON.stringify({
			// 					roles,
			// 				}),
			// 				headers: {
			// 					'Content-Type': 'application/json',
			// 				},
			// 			},
			// 		)
			// 	})
			//
			// 	let relaodedMember = await step.run(
			// 		'reload discord member',
			// 		async () => {
			// 			return await fetchJsonAsDiscordBot<DiscordMember | DiscordError>(
			// 				`guilds/${env.DISCORD_GUILD_ID}/members/${discordMember.user.id}`,
			// 			)
			// 		},
			// 	)
			//
			//
			//
			// 	console.log({ relaodedMember })
			// }

			const convertkitUser = await step.run('get convertkit user', async () => {
				console.log('get ck user', { user })
				return emailListProvider.getSubscriberByEmail(user.email)
			})

			if (convertkitUser && emailListProvider.updateSubscriberFields) {
				await step.run('update convertkit user', async () => {
					const productSlug = purchase.product.fields?.slug
					const purchasedOnFieldName = productSlug
						? `purchased_${productSlug.replace(/-/gi, '_')}_on`
						: process.env.CONVERTKIT_PURCHASED_ON_FIELD_NAME || 'purchased_on'

					return emailListProvider.updateSubscriberFields?.({
						subscriberId: convertkitUser.id,
						fields: {
							[purchasedOnFieldName]: format(
								new Date(purchase.createdAt),
								'yyyy-MM-dd HH:mm:ss z',
							),
						},
					})
				})
				console.log(`synced convertkit tags for ${purchase.id}`)
			} else {
				console.log(`no convertkit tags to sync for ${user.email}`)
			}

			await step.sleep('sleep for 200ms', '200ms')
		}
	},
)
