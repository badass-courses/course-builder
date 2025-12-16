import { db } from '@/db'
import {
	accounts,
	entitlements,
	entitlementTypes,
	products,
	purchases,
} from '@/db/schema'
import { env } from '@/env.mjs'
import { PRODUCT_TYPE_CONFIG } from '@/inngest/config/product-types'
import { inngest } from '@/inngest/inngest.server'
import { log } from '@/server/logger'
import { and, eq, inArray } from 'drizzle-orm'

import { USER_ADDED_TO_WORKSHOP_EVENT } from './discord/add-discord-role-workflow'

/**
 * Sync Discord Roles for Entitlements (Workshops Only)
 * Simple 3-step process:
 * 1. Find the workshop role ID (from product or default)
 * 2. Find people who have Discord accounts AND purchased the product
 * 3. Trigger the workflow to add the Discord role and update everyone's Discord roles
 *
 * NOTE: productId is required - this function works on a per-product basis
 * NOTE: Only processes workshops (self-paced products), NOT cohorts
 */
export const syncDiscordRolesForEntitlements = inngest.createFunction(
	{
		id: 'sync-discord-roles-for-entitlements',
		name: 'Sync Discord Roles for Entitlements',
	},
	[{ event: 'sync/discord-roles-for-entitlements' }],
	async ({ event, step }) => {
		const eventData = event.data as {
			productId: string // Required - must specify which product to sync
			limit?: number
			offset?: number
		}

		const { productId, limit, offset = 0 } = eventData || {}

		if (!productId) {
			await log.error('sync_discord_product_id_required', {
				note: 'productId is required for this function',
			})
			return {
				processed: 0,
				triggered: 0,
				skipped: 0,
				errorCount: 1,
				errors: [
					{
						userId: 'validation',
						error: 'productId is required',
					},
				],
			}
		}

		// Step 1: Find the workshop role ID
		const { discordRoleId, workshopId } = await step.run(
			'step 1: find workshop role id',
			async () => {
				// Get product with its resources
				const product = await db.query.products.findFirst({
					where: eq(products.id, productId),
					with: {
						resources: {
							with: {
								resource: {
									columns: { id: true, type: true },
								},
							},
						},
					},
				})

				if (!product) {
					throw new Error(`Product ${productId} not found`)
				}

				// Get workshop resource from product
				const workshopResource = product.resources?.find(
					(r) => r.resource?.type === 'workshop',
				)

				if (!workshopResource?.resource?.id) {
					throw new Error(`No workshop resource found for product ${productId}`)
				}

				const workshopId = workshopResource.resource.id

				// Get Discord role ID from product fields or use default
				const productConfig = PRODUCT_TYPE_CONFIG['self-paced']
				const discordRoleId =
					(product.fields as any)?.discordRoleId ||
					env.DISCORD_PURCHASER_ROLE_ID

				if (!discordRoleId) {
					throw new Error(`No Discord role ID found for product ${productId}`)
				}

				await log.info('sync_discord_step1_role_id_found', {
					productId,
					workshopId,
					discordRoleId,
					fromProductFields: !!(product.fields as any)?.discordRoleId,
				})

				return { discordRoleId, workshopId }
			},
		)

		// Step 2: Find people who have Discord accounts AND purchased the product
		const usersToSync = await step.run(
			'step 2: find users with discord and purchases',
			async () => {
				// Find all purchases for this product
				const productPurchases = await db.query.purchases.findMany({
					where: eq(purchases.productId, productId),
					columns: { id: true, userId: true },
				})

				if (productPurchases.length === 0) {
					await log.info('sync_discord_no_purchases', {
						productId,
					})
					return []
				}

				const userIds = Array.from(
					new Set(
						productPurchases
							.map((p) => p.userId)
							.filter((id): id is string => Boolean(id)),
					),
				)

				// Find which of these users have Discord accounts
				const usersWithDiscord = await db.query.accounts.findMany({
					where: and(
						inArray(accounts.userId, userIds),
						eq(accounts.provider, 'discord'),
					),
					columns: { userId: true },
				})

				const userIdsWithDiscord = usersWithDiscord
					.map((a) => a.userId)
					.filter(Boolean) as string[]

				if (userIdsWithDiscord.length === 0) {
					await log.info('sync_discord_no_users_with_discord', {
						productId,
						totalUsers: userIds.length,
					})
					return []
				}

				// Apply offset and limit
				let result = userIdsWithDiscord
				if (offset > 0) {
					result = result.slice(offset)
				}
				if (limit !== undefined && limit > 0) {
					result = result.slice(0, limit)
				}

				await log.info('sync_discord_step2_users_found', {
					productId,
					totalPurchases: productPurchases.length,
					totalUsers: userIds.length,
					usersWithDiscord: userIdsWithDiscord.length,
					finalCount: result.length,
					limit,
					offset,
				})

				return result
			},
		)

		// Step 3: Trigger the workflow for EACH user in their own isolated step
		// Each user needs their own step to sync the role - this prevents loops
		// IMPORTANT: Process sequentially, not in parallel, to avoid loops
		const stepResults: Array<{
			success: boolean
			userId: string
			error?: string
		}> = []

		for (const userId of usersToSync) {
			// Each user gets their own isolated step.run
			// This ensures each user's processing is separate and won't cause loops
			const result = await step.run(
				`sync discord role for user ${userId}`,
				async () => {
					// Just log and return - we'll send the event OUTSIDE the step.run
					await log.info('sync_discord_preparing_to_trigger', {
						userId,
						workshopId,
						discordRoleId,
					})
					return { userId }
				},
			)

			// Send event OUTSIDE of step.run to prevent loops
			// This is the critical fix - step.sendEvent should NOT be inside step.run
			try {
				await step.sendEvent(`send-discord-role-event-for-${userId}`, {
					name: USER_ADDED_TO_WORKSHOP_EVENT,
					data: {
						workshopId,
						userId,
						discordRoleId,
					},
				})

				await log.info('sync_discord_step3_role_triggered', {
					userId,
					workshopId,
					discordRoleId,
					eventName: USER_ADDED_TO_WORKSHOP_EVENT,
				})

				stepResults.push({ success: true, userId })
			} catch (error) {
				const errorMessage =
					error instanceof Error ? error.message : String(error)
				await log.error('sync_discord_error', {
					userId,
					error: errorMessage,
				})
				stepResults.push({
					success: false,
					userId,
					error: errorMessage,
				})
			}
		}

		// Count results
		const results = {
			processed: stepResults.length,
			triggered: stepResults.filter((r) => r.success).length,
			skipped: 0,
			errorCount: stepResults.filter((r) => !r.success).length,
			errors: stepResults
				.filter((r) => !r.success)
				.map((r) => ({
					userId: r.userId,
					error: r.error || 'Unknown error',
				})),
		}

		return {
			...results,
			workshopId,
			discordRoleId,
		}
	},
)
