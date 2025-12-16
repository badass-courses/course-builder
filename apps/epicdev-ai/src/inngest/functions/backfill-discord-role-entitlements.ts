import { db } from '@/db'
import {
	accounts,
	entitlements,
	entitlementTypes,
	products,
	purchases,
} from '@/db/schema'
import {
	ENTITLEMENT_CONFIG,
	PRODUCT_TYPE_CONFIG,
	ProductType,
} from '@/inngest/config/product-types'
import { inngest } from '@/inngest/inngest.server'
import { EntitlementSourceType } from '@/lib/entitlements'
import { ensurePersonalOrganizationWithLearnerRole } from '@/lib/personal-organization-service'
import { log } from '@/server/logger'
import { and, eq, inArray, isNull, or } from 'drizzle-orm'

import { guid } from '@coursebuilder/adapter-drizzle/mysql'

/**
 * Backfill Discord Role Entitlements
 * Finds users with purchases but missing Discord role entitlements and creates them
 *
 * IMPORTANT: This function ONLY creates entitlements - it does NOT sync Discord roles.
 * Discord role syncing should be handled in a separate function/script to avoid hanging issues.
 *
 * This function will:
 * - Create missing Discord role entitlements for purchases
 * - Skip purchases that already have entitlements
 * - Complete quickly without Discord API calls that could cause hanging
 */
export const backfillDiscordRoleEntitlements = inngest.createFunction(
	{
		id: 'backfill-discord-role-entitlements',
		name: 'Backfill Discord Role Entitlements',
	},
	[{ event: 'backfill/discord-role-entitlements' }],
	async ({ event, step, db: adapter }) => {
		const eventData = event.data as {
			productId?: string
			productType?: ProductType
			limit?: number
			offset?: number
		}

		const { productId, productType, limit, offset = 0 } = eventData || {}

		// If productType isn't provided, process all types in ENTITLEMENT_CONFIG
		const productTypes: ProductType[] = productType
			? [productType]
			: (Object.keys(ENTITLEMENT_CONFIG) as ProductType[])

		// ✅ Per-purchase action records (created/skipped/error)
		type PurchaseAction =
			| {
					action: 'created'
					purchaseId: string
					userId: string
					entitlementId: string
					productType: ProductType
					resourceId: string
					discordRoleId: string
					hasDiscordAccount: boolean
					syncedDiscord: boolean
					eventSent: string | null
			  }
			| {
					action: 'skipped'
					purchaseId: string
					userId?: string
					productType: ProductType
					reason: string
			  }
			| {
					action: 'error'
					purchaseId: string
					userId?: string
					productType: ProductType
					error: string
			  }

		const actions: PurchaseAction[] = []

		const results = {
			processed: 0,
			created: 0,
			skipped: 0,
			errorCount: 0,
			errors: [] as Array<{ purchaseId: string; error: string }>,
		}

		for (const type of productTypes) {
			const entitlementConfig = ENTITLEMENT_CONFIG[type]
			if (!entitlementConfig) {
				await log.warn('backfill_unsupported_product_type', {
					productType: type,
				})
				continue
			}

			// Get Discord role entitlement type
			const discordRoleEntitlementType = await step.run(
				`get ${entitlementConfig.logPrefix} discord role entitlement type`,
				async () => {
					const found = await db.query.entitlementTypes.findFirst({
						where: eq(entitlementTypes.name, entitlementConfig.discordRole),
					})

					if (!found) {
						await log.error(
							'backfill_discord_role_entitlement_type_not_found',
							{
								expectedName: entitlementConfig.discordRole,
								productType: type,
							},
						)
						return null
					}

					return { id: found.id, name: found.name }
				},
			)

			if (!discordRoleEntitlementType) {
				await log.error('backfill_skipping_product_type', {
					productType: type,
					reason: 'Discord role entitlement type not found',
				})
				continue
			}

			// Find purchases for this product type
			const purchasesToProcess = await step.run(
				`find ${entitlementConfig.logPrefix} purchases`,
				async () => {
					let productIds: string[]

					if (productId) {
						const product = await db.query.products.findFirst({
							where: eq(products.id, productId),
						})

						if (!product) {
							await log.warn('backfill_product_not_found', { productId })
							return []
						}

						if (product.type !== type) {
							await log.warn('backfill_product_type_mismatch', {
								productId,
								expectedType: type,
								actualType: product.type,
							})
							return []
						}

						productIds = [productId]
					} else {
						const allProducts = await db.query.products.findMany({
							where: eq(products.type, type),
						})
						productIds = allProducts.map((p) => p.id)
					}

					if (productIds.length === 0) return []

					// Optional: dedupe productIds to avoid accidental duplication
					productIds = [...new Set(productIds)]

					const queryConfig = {
						where: and(
							inArray(purchases.productId, productIds),
							or(
								eq(purchases.status, 'Valid'),
								eq(purchases.status, 'Restricted'),
							),
						),
						with: {
							user: {
								columns: { id: true, email: true, name: true },
							},
						} as const,
						...(limit !== undefined && { limit }),
						...(offset > 0 && { offset }),
					}

					const foundPurchases = await db.query.purchases.findMany(queryConfig)

					// Optional: dedupe purchases by id (extra safety)
					const dedupedPurchases = Array.from(
						new Map(foundPurchases.map((p) => [p.id, p])).values(),
					)

					return dedupedPurchases
				},
			)

			// ✅ Process each purchase in its own step (isolated failures)
			for (const purchase of purchasesToProcess) {
				// First, process the purchase and create entitlement
				const action = await step.run(
					`process purchase ${purchase.id}`,
					async (): Promise<PurchaseAction> => {
						results.processed++

						try {
							// Get product
							const product = await adapter.getProduct(purchase.productId)
							if (!product) {
								results.skipped++
								await log.warn('backfill_product_not_found', {
									purchaseId: purchase.id,
									productId: purchase.productId,
								})
								return {
									action: 'skipped',
									purchaseId: purchase.id,
									userId: purchase.userId ?? undefined,
									productType: type,
									reason: 'product_not_found',
								}
							}

							// Primary resource
							const primaryResource = product.resources?.find(
								(r: any) =>
									r.resource?.type === PRODUCT_TYPE_CONFIG[type].resourceType,
							)?.resource

							if (!primaryResource?.id) {
								results.skipped++
								await log.warn('backfill_no_resource_found', {
									purchaseId: purchase.id,
									productId: purchase.productId,
									productType: type,
								})
								return {
									action: 'skipped',
									purchaseId: purchase.id,
									userId: purchase.userId ?? undefined,
									productType: type,
									reason: 'no_primary_resource',
								}
							}

							// Discord role id
							const discordRoleId =
								PRODUCT_TYPE_CONFIG[type].getDiscordRoleId(product)

							if (!discordRoleId) {
								results.skipped++
								await log.warn('backfill_no_discord_role_id', {
									purchaseId: purchase.id,
									productId: purchase.productId,
									productType: type,
								})
								return {
									action: 'skipped',
									purchaseId: purchase.id,
									userId: purchase.userId ?? undefined,
									productType: type,
									reason: 'no_discord_role_id',
								}
							}

							if (!purchase.userId) {
								results.skipped++
								await log.warn('backfill_no_user_id', {
									purchaseId: purchase.id,
								})
								return {
									action: 'skipped',
									purchaseId: purchase.id,
									productType: type,
									reason: 'no_user_id',
								}
							}

							// Existing entitlement?
							const existingEntitlement = await db.query.entitlements.findFirst(
								{
									where: and(
										eq(entitlements.userId, purchase.userId),
										eq(
											entitlements.entitlementType,
											discordRoleEntitlementType.id,
										),
										eq(entitlements.sourceId, purchase.id),
										eq(entitlements.sourceType, EntitlementSourceType.PURCHASE),
										isNull(entitlements.deletedAt),
									),
								},
							)

							if (existingEntitlement) {
								results.skipped++
								await log.info('backfill_entitlement_exists', {
									purchaseId: purchase.id,
									userId: purchase.userId,
									entitlementId: existingEntitlement.id,
								})
								return {
									action: 'skipped',
									purchaseId: purchase.id,
									userId: purchase.userId,
									productType: type,
									reason: 'discord_entitlement_already_exists',
								}
							}

							// Ensure user present (needed for org membership creation)
							if (!purchase.user) {
								results.skipped++
								await log.warn('backfill_no_user', {
									purchaseId: purchase.id,
									userId: purchase.userId,
								})
								return {
									action: 'skipped',
									purchaseId: purchase.id,
									userId: purchase.userId,
									productType: type,
									reason: 'purchase_user_missing',
								}
							}

							const personalOrgResult =
								await ensurePersonalOrganizationWithLearnerRole(
									purchase.user,
									adapter,
								)

							const entitlementId = `${primaryResource.id}-discord-${guid()}`
							const createdEntitlementId =
								await entitlementConfig.createEntitlement({
									id: entitlementId,
									userId: purchase.userId,
									organizationId: personalOrgResult.organization.id,
									organizationMembershipId: personalOrgResult.membership.id,
									entitlementType: discordRoleEntitlementType.id,
									sourceType: EntitlementSourceType.PURCHASE,
									sourceId: purchase.id,
									metadata: { discordRoleId },
								})

							results.created++

							return {
								action: 'created',
								purchaseId: purchase.id,
								userId: purchase.userId,
								entitlementId: createdEntitlementId,
								productType: type,
								resourceId: primaryResource.id,
								discordRoleId,
								hasDiscordAccount: false, // Not checking Discord in this function
								syncedDiscord: false,
								eventSent: null,
							}
						} catch (error) {
							results.errorCount++
							const errorMessage =
								error instanceof Error ? error.message : String(error)
							results.errors.push({
								purchaseId: purchase.id,
								error: errorMessage,
							})
							await log.error('backfill_error', {
								purchaseId: purchase.id,
								userId: purchase.userId,
								error: errorMessage,
							})
							return {
								action: 'error',
								purchaseId: purchase.id,
								userId: purchase.userId ?? undefined,
								productType: type,
								error: errorMessage,
							}
						}
					},
				)

				// ✅ Collect each per-purchase result (for accurate summary)
				actions.push(action)
			}
		}

		// ✅ One final summary step that cannot lie (computed from per-step returns)
		const summary = await step.run('summary', async () => {
			const created = actions.filter((a) => a.action === 'created').length
			const skipped = actions.filter((a) => a.action === 'skipped').length
			const errors = actions.filter((a) => a.action === 'error').length

			const createdUsers = new Set(
				actions
					.filter(
						(a): a is Extract<PurchaseAction, { action: 'created' }> =>
							a.action === 'created',
					)
					.map((a) => a.userId),
			)

			const processedUsers = new Set(
				actions
					.map((a) => ('userId' in a ? a.userId : undefined))
					.filter((u): u is string => Boolean(u)),
			)

			const skippedByReason = actions.reduce<Record<string, number>>(
				(acc, a) => {
					if (a.action === 'skipped') {
						acc[a.reason] = (acc[a.reason] ?? 0) + 1
					}
					return acc
				},
				{},
			)

			return {
				purchasesProcessed: actions.length,
				purchasesCreated: created,
				purchasesSkipped: skipped,
				purchasesErrored: errors,
				uniqueUsersProcessed: processedUsers.size,
				uniqueUsersCreated: createdUsers.size,
				skippedByReason,
				note: 'Discord role sync should be handled in a separate function/script',
			}
		})

		// Return both the original counters and the computed summary
		return {
			...results,
			summary,
		}
	},
)
