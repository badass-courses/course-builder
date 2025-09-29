import { db } from '@/db'
import { entitlements, entitlementTypes } from '@/db/schema'
import { env } from '@/env.mjs'
import { inngest } from '@/inngest/inngest.server'
import { getDiscordAccount } from '@/lib/discord-query'
import { removeDiscordRole } from '@/lib/discord-utils'
import { EntitlementSourceType } from '@/lib/entitlements'
import { log } from '@/server/logger'
import { and, eq, isNull } from 'drizzle-orm'

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

		if (!purchase || !purchase.userId) {
			throw new Error('No purchase found')
		}

		const user = await step.run('get user', async () => {
			return adapter.getUserById(purchase.userId as string)
		})

		if (!user) {
			throw new Error('No user found')
		}

		// Get the product to determine what type of purchase this was
		const product = await step.run('get product', async () => {
			return adapter.getProduct(purchase.productId as string)
		})

		if (!product) {
			log.warn('Product not found for purchase', {
				purchaseId: purchase.id,
				productId: purchase.productId,
				userId: user.id,
			})
			return {
				status: 'skipped',
				reason: 'Product not found',
				userId: user.id,
				purchaseId: purchase.id,
			}
		}

		// Find all Discord role entitlements for this purchase
		const discordRoleEntitlements = await step.run(
			'get discord role entitlements for purchase',
			async () => {
				// Get all Discord role entitlement types
				const cohortDiscordRoleType = await db.query.entitlementTypes.findFirst(
					{
						where: eq(entitlementTypes.name, 'cohort_discord_role'),
					},
				)

				const workshopDiscordRoleType =
					await db.query.entitlementTypes.findFirst({
						where: eq(entitlementTypes.name, 'workshop_discord_role'),
					})

				const discordEntitlementTypeIds = [
					cohortDiscordRoleType?.id,
					workshopDiscordRoleType?.id,
				].filter(Boolean)

				if (discordEntitlementTypeIds.length === 0) {
					return []
				}

				// Find entitlements for this purchase that are Discord role entitlements
				const userDiscordEntitlements = await db.query.entitlements.findMany({
					where: and(
						eq(entitlements.userId, user.id),
						eq(entitlements.sourceType, EntitlementSourceType.PURCHASE),
						eq(entitlements.sourceId, purchase.id),
						isNull(entitlements.deletedAt),
					),
				})

				// Filter for Discord role entitlements only
				return userDiscordEntitlements.filter((entitlement) =>
					discordEntitlementTypeIds.includes(entitlement.entitlementType),
				)
			},
		)

		if (discordRoleEntitlements.length === 0) {
			log.info('No Discord role entitlements found for purchase', {
				purchaseId: purchase.id,
				userId: user.id,
				productType: product.type,
			})
			return {
				status: 'skipped',
				reason: 'No Discord role entitlements found for this purchase',
				userId: user.id,
				purchaseId: purchase.id,
			}
		}

		// Remove each Discord role that was granted by this purchase
		const removalResults = []

		for (const entitlement of discordRoleEntitlements) {
			const discordRoleId = entitlement.metadata?.discordRoleId

			if (!discordRoleId) {
				log.warn('Discord role entitlement missing role ID', {
					entitlementId: entitlement.id,
					purchaseId: purchase.id,
					userId: user.id,
				})
				continue
			}

			const result = await step.run(
				`remove discord role ${discordRoleId}`,
				async () => {
					return await removeDiscordRole(user.id, discordRoleId)
				},
			)

			removalResults.push({
				entitlementId: entitlement.id,
				discordRoleId,
				result,
			})

			// Soft delete the Discord role entitlement
			await step.run(
				`soft delete discord role entitlement ${entitlement.id}`,
				async () => {
					await db
						.update(entitlements)
						.set({ deletedAt: new Date() })
						.where(eq(entitlements.id, entitlement.id))

					log.info('Soft deleted Discord role entitlement', {
						entitlementId: entitlement.id,
						purchaseId: purchase.id,
						userId: user.id,
						discordRoleId,
					})
				},
			)
		}

		log.info('Removed Discord roles for refunded purchase', {
			purchaseId: purchase.id,
			userId: user.id,
			productType: product.type,
			rolesRemoved: removalResults.length,
			removalResults,
		})

		return {
			status: 'success',
			userId: user.id,
			purchaseId: purchase.id,
			productType: product.type,
			rolesRemoved: removalResults.length,
			removalResults,
		}
	},
)
