import type { AdapterSession, AdapterUser } from '@auth/core/adapters'
import { addSeconds, isAfter } from 'date-fns'
import {
	and,
	asc,
	desc,
	eq,
	gte,
	inArray,
	isNotNull,
	isNull,
	not,
	or,
	sql,
} from 'drizzle-orm'
import {
	mysqlTable as defaultMySqlTableFn,
	MySqlDatabase,
	MySqlTableFn,
} from 'drizzle-orm/mysql-core'
import { v4 } from 'uuid'
import { z } from 'zod'

import { type CourseBuilderAdapter } from '@coursebuilder/core/adapters'
import {
	Coupon,
	couponSchema,
	MerchantCharge,
	merchantChargeSchema,
	MerchantCoupon,
	merchantCouponSchema,
	MerchantCustomer,
	merchantPriceSchema,
	MerchantProduct,
	merchantProductSchema,
	Price,
	priceSchema,
	Product,
	productSchema,
	Purchase,
	purchaseSchema,
	PurchaseUserTransfer,
	PurchaseUserTransferState,
	ResourceProgress,
	resourceProgressSchema,
	UpgradableProduct,
	upgradableProductSchema,
	User,
	userSchema,
} from '@coursebuilder/core/schemas'
import {
	ContentResourceResourceSchema,
	ContentResourceSchema,
} from '@coursebuilder/core/schemas/content-resource-schema'
import { merchantAccountSchema } from '@coursebuilder/core/schemas/merchant-account-schema'
import { merchantCustomerSchema } from '@coursebuilder/core/schemas/merchant-customer-schema'
import { type ModuleProgress } from '@coursebuilder/core/schemas/resource-progress-schema'
import { VideoResourceSchema } from '@coursebuilder/core/schemas/video-resource'
import { validateCoupon } from '@coursebuilder/core/utils/validate-coupon'

import {
	getAccountsRelationsSchema,
	getAccountsSchema,
} from './schemas/auth/accounts.js'
import {
	getPermissionsRelationsSchema,
	getPermissionsSchema,
} from './schemas/auth/permissions.js'
import {
	getRolePermissionsRelationsSchema,
	getRolePermissionsSchema,
} from './schemas/auth/role-permissions.js'
import {
	getRolesRelationsSchema,
	getRolesSchema,
} from './schemas/auth/roles.js'
import {
	getSessionRelationsSchema,
	getSessionsSchema,
} from './schemas/auth/sessions.js'
import {
	getUserPermissionsRelationsSchema,
	getUserPermissionsSchema,
} from './schemas/auth/user-permissions.js'
import {
	getUserRolesRelationsSchema,
	getUserRolesSchema,
} from './schemas/auth/user-roles.js'
import {
	getUsersRelationsSchema,
	getUsersSchema,
} from './schemas/auth/users.js'
import { getVerificationTokensSchema } from './schemas/auth/verification-tokens.js'
import {
	getCouponRelationsSchema,
	getCouponSchema,
} from './schemas/commerce/coupon.js'
import { getMerchantAccountSchema } from './schemas/commerce/merchant-account.js'
import { getMerchantChargeSchema } from './schemas/commerce/merchant-charge.js'
import { getMerchantCouponSchema } from './schemas/commerce/merchant-coupon.js'
import { getMerchantCustomerSchema } from './schemas/commerce/merchant-customer.js'
import { getMerchantPriceSchema } from './schemas/commerce/merchant-price.js'
import { getMerchantProductSchema } from './schemas/commerce/merchant-product.js'
import { getMerchantSessionSchema } from './schemas/commerce/merchant-session.js'
import { getPriceSchema } from './schemas/commerce/price.js'
import {
	getProductRelationsSchema,
	getProductSchema,
} from './schemas/commerce/product.js'
import { getPurchaseUserTransferSchema } from './schemas/commerce/purchase-user-transfer.js'
import {
	getPurchaseRelationsSchema,
	getPurchaseSchema,
} from './schemas/commerce/purchase.js'
import {
	getUpgradableProductsRelationsSchema,
	getUpgradableProductsSchema,
} from './schemas/commerce/upgradable-products.js'
import { getCommunicationChannelSchema } from './schemas/communication/communication-channel.js'
import { getCommunicationPreferenceTypesSchema } from './schemas/communication/communication-preference-types.js'
import {
	getCommunicationPreferencesRelationsSchema,
	getCommunicationPreferencesSchema,
} from './schemas/communication/communication-preferences.js'
import {
	getContentContributionRelationsSchema,
	getContentContributionsSchema,
} from './schemas/content/content-contributions.js'
import {
	getContentResourceProductRelationsSchema,
	getContentResourceProductSchema,
} from './schemas/content/content-resource-product.js'
import {
	getContentResourceResourceRelationsSchema,
	getContentResourceResourceSchema,
} from './schemas/content/content-resource-resource.js'
import {
	getContentResourceRelationsSchema,
	getContentResourceSchema,
} from './schemas/content/content-resource.js'
import {
	getContributionTypesRelationsSchema,
	getContributionTypesSchema,
} from './schemas/content/contribution-types.js'
import { getResourceProgressSchema } from './schemas/content/resource-progress.js'

export function getCourseBuilderSchema(mysqlTable: MySqlTableFn) {
	return {
		accounts: getAccountsSchema(mysqlTable),
		accountsRelations: getAccountsRelationsSchema(mysqlTable),
		permissions: getPermissionsSchema(mysqlTable),
		permissionsRelations: getPermissionsRelationsSchema(mysqlTable),
		rolePermissions: getRolePermissionsSchema(mysqlTable),
		rolePermissionsRelations: getRolePermissionsRelationsSchema(mysqlTable),
		roles: getRolesSchema(mysqlTable),
		rolesRelations: getRolesRelationsSchema(mysqlTable),
		sessions: getSessionsSchema(mysqlTable),
		sessionsRelations: getSessionRelationsSchema(mysqlTable),
		userPermissions: getUserPermissionsSchema(mysqlTable),
		userPermissionsRelations: getUserPermissionsRelationsSchema(mysqlTable),
		userRoles: getUserRolesSchema(mysqlTable),
		userRolesRelations: getUserRolesRelationsSchema(mysqlTable),
		users: getUsersSchema(mysqlTable),
		usersRelations: getUsersRelationsSchema(mysqlTable),
		verificationTokens: getVerificationTokensSchema(mysqlTable),
		coupon: getCouponSchema(mysqlTable),
		couponRelations: getCouponRelationsSchema(mysqlTable),
		merchantAccount: getMerchantAccountSchema(mysqlTable),
		merchantCharge: getMerchantChargeSchema(mysqlTable),
		merchantCoupon: getMerchantCouponSchema(mysqlTable),
		merchantCustomer: getMerchantCustomerSchema(mysqlTable),
		merchantPrice: getMerchantPriceSchema(mysqlTable),
		merchantProduct: getMerchantProductSchema(mysqlTable),
		merchantSession: getMerchantSessionSchema(mysqlTable),
		prices: getPriceSchema(mysqlTable),
		products: getProductSchema(mysqlTable),
		purchases: getPurchaseSchema(mysqlTable),
		purchaseRelations: getPurchaseRelationsSchema(mysqlTable),
		purchaseUserTransfer: getPurchaseUserTransferSchema(mysqlTable),
		communicationChannel: getCommunicationChannelSchema(mysqlTable),
		communicationPreferenceTypes:
			getCommunicationPreferenceTypesSchema(mysqlTable),
		communicationPreferences: getCommunicationPreferencesSchema(mysqlTable),
		communicationPreferencesRelations:
			getCommunicationPreferencesRelationsSchema(mysqlTable),
		contentContributions: getContentContributionsSchema(mysqlTable),
		contentContributionRelations:
			getContentContributionRelationsSchema(mysqlTable),
		contentResource: getContentResourceSchema(mysqlTable),
		contentResourceRelations: getContentResourceRelationsSchema(mysqlTable),
		contentResourceResource: getContentResourceResourceSchema(mysqlTable),
		contentResourceResourceRelations:
			getContentResourceResourceRelationsSchema(mysqlTable),
		contributionTypes: getContributionTypesSchema(mysqlTable),
		contributionTypesRelations: getContributionTypesRelationsSchema(mysqlTable),
		resourceProgress: getResourceProgressSchema(mysqlTable),
		upgradableProducts: getUpgradableProductsSchema(mysqlTable),
		upgradableProductsRelations:
			getUpgradableProductsRelationsSchema(mysqlTable),
		contentResourceProduct: getContentResourceProductSchema(mysqlTable),
		contentResourceProductRelations:
			getContentResourceProductRelationsSchema(mysqlTable),
		productRelations: getProductRelationsSchema(mysqlTable),
	} as const
}

export function createTables(mySqlTable: MySqlTableFn) {
	return getCourseBuilderSchema(mySqlTable)
}

export type DefaultSchema = ReturnType<typeof createTables>

export function mySqlDrizzleAdapter(
	client: InstanceType<typeof MySqlDatabase>,
	tableFn = defaultMySqlTableFn,
): CourseBuilderAdapter<typeof MySqlDatabase> {
	const {
		users,
		accounts,
		sessions,
		verificationTokens,
		contentResource,
		contentResourceResource,
		purchases: purchaseTable,
		purchaseUserTransfer,
		coupon,
		merchantCoupon,
		merchantCharge,
		merchantAccount,
		merchantPrice,
		merchantCustomer,
		merchantSession,
		merchantProduct,
		prices,
		products,
		upgradableProducts,
		resourceProgress,
	} = createTables(tableFn)

	const adapter: CourseBuilderAdapter = {
		client,
		async redeemFullPriceCoupon(options) {
			const {
				email: baseEmail,
				couponId,
				productIds,
				currentUserId,
				redeemingProductId,
			} = options
			const email = String(baseEmail).replace(' ', '+')

			const coupon = await adapter.getCouponWithBulkPurchases(couponId)

			const productId =
				(coupon && (coupon.restrictedToProductId as string)) ||
				redeemingProductId

			if (!productId) throw new Error(`unable-to-find-any-product-id`)

			const couponValidation = validateCoupon(coupon, productIds)

			if (coupon && couponValidation.isRedeemable) {
				// if the Coupon is the Bulk Coupon of a Bulk Purchase,
				// then a bulk coupon is being redeemed
				const bulkCouponRedemption = Boolean(
					coupon.bulkCouponPurchases[0]?.bulkCouponId,
				)

				const { user } = await adapter.findOrCreateUser(email)

				if (!user) throw new Error(`unable-to-create-user-${email}`)

				const currentUser = currentUserId
					? await adapter.getUserById(currentUserId)
					: null

				const redeemingForCurrentUser = currentUser?.id === user.id

				// To prevent double-purchasing, check if this user already has a
				// Purchase record for this product that is valid and wasn't a bulk
				// coupon purchase.
				const existingPurchases =
					await adapter.getExistingNonBulkValidPurchasesOfProduct({
						userId: user.id,
						productId,
					})

				if (existingPurchases.length > 0)
					throw new Error(`already-purchased-${email}`)

				const purchaseId = `purchase-${v4()}`

				await adapter.createPurchase({
					id: purchaseId,
					userId: user.id,
					couponId: bulkCouponRedemption ? null : coupon.id,
					redeemedBulkCouponId: bulkCouponRedemption ? coupon.id : null,
					productId,
					totalAmount: '0',
					metadata: {
						couponUsedId: bulkCouponRedemption ? null : coupon.id,
					},
				})

				const newPurchase = await adapter.getPurchase(purchaseId)

				await adapter.incrementCouponUsedCount(coupon.id)

				await adapter.createPurchaseTransfer({
					sourceUserId: user.id,
					purchaseId: purchaseId,
					expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
				})

				return { purchase: newPurchase, redeemingForCurrentUser }
			}

			return null
		},
		createPurchaseTransfer: async (options) => {
			const id = `put_${v4()}`
			await client.insert(purchaseUserTransfer).values({
				id,
				purchaseId: options.purchaseId,
				sourceUserId: options.sourceUserId,
				expiresAt: options.expiresAt,
			})
		},
		incrementCouponUsedCount: async (couponId) => {
			await client
				.update(coupon)
				.set({ usedCount: sql`${coupon.usedCount} + 1` })
				.where(eq(coupon.id, couponId))
		},
		getExistingNonBulkValidPurchasesOfProduct: async ({
			userId,
			productId,
		}) => {
			const existingPurchases = await client.query.purchases.findMany({
				where: and(
					eq(purchaseTable.userId, userId),
					productId ? eq(purchaseTable.productId, productId) : undefined,
					eq(purchaseTable.status, 'Valid'),
					isNull(purchaseTable.bulkCouponId),
				),
			})

			return z.array(purchaseSchema).parse(existingPurchases)
		},
		createMerchantCustomer: async (options) => {
			await client.insert(merchantCustomer).values({
				id: `mc_${v4()}`,
				identifier: options.identifier,
				merchantAccountId: options.merchantAccountId,
				userId: options.userId,
				status: 1,
			})
			return merchantCustomerSchema.parse(
				await client.query.merchantCustomer.findFirst({
					where: eq(merchantCustomer.identifier, options.identifier),
				}),
			)
		},
		getMerchantAccount: async (options) => {
			return merchantAccountSchema.parse(
				await client.query.merchantAccount.findFirst({
					where: eq(merchantAccount.label, options.provider),
				}),
			)
		},
		getMerchantPriceForProductId: async (productId) => {
			const merchantPriceData = await client.query.merchantPrice.findFirst({
				where: eq(merchantPrice.merchantProductId, productId),
			})

			const parsedMerchantPrice =
				merchantPriceSchema.safeParse(merchantPriceData)

			if (!parsedMerchantPrice.success) {
				console.error(
					'Error parsing merchant price',
					JSON.stringify(parsedMerchantPrice.error),
				)
				return null
			}

			return parsedMerchantPrice.data
		},
		getMerchantProductForProductId: async (productId) => {
			const merchantProductData = await client.query.merchantProduct.findFirst({
				where: eq(merchantProduct.productId, productId),
			})

			if (!merchantProductData) return null
			return merchantProductSchema.parse(merchantProductData)
		},
		getMerchantCustomerForUserId: async (userId) => {
			const merchantCustomerData =
				await client.query.merchantCustomer.findFirst({
					where: eq(merchantCustomer.userId, userId),
				})

			if (!merchantCustomerData) return null
			return merchantCustomerSchema.parse(merchantCustomerData)
		},
		getUpgradableProducts: async (options) => {
			const { upgradableFromId, upgradableToId } = options
			return z.array(upgradableProductSchema).parse(
				await client.query.upgradableProducts.findMany({
					where: and(
						eq(upgradableProducts.upgradableFromId, upgradableFromId),
						eq(upgradableProducts.upgradableToId, upgradableToId),
					),
				}),
			)
		},
		async availableUpgradesForProduct(
			purchases: any,
			productId: string,
		): Promise<any[]> {
			const previousPurchaseProductIds = purchases.map(
				({ productId }: Purchase) => productId,
			)

			if (previousPurchaseProductIds.length > 0) {
				return await client.query.upgradableProducts.findMany({
					where: and(
						eq(upgradableProducts.upgradableToId, productId),
						inArray(
							upgradableProducts.upgradableFromId,
							previousPurchaseProductIds,
						),
					),
				})
			}
			return []
		},
		clearLessonProgressForUser(options: {
			userId: string
			lessons: { id: string; slug: string }[]
		}): Promise<void> {
			throw new Error('Method not implemented.')
		},
		async completeLessonProgressForUser(options: {
			userId: string
			lessonId?: string
		}): Promise<ResourceProgress | null> {
			if (!options.lessonId) {
				throw new Error('No lessonId provided')
			}

			let lessonProgress = await client.query.resourceProgress.findFirst({
				where: and(
					eq(resourceProgress.userId, options.userId),
					eq(resourceProgress.contentResourceId, options.lessonId),
				),
			})

			const now = new Date()

			if (lessonProgress) {
				if (!lessonProgress.completedAt) {
					await client
						.update(resourceProgress)
						.set({
							completedAt: now,
							updatedAt: now,
						})
						.where(eq(resourceProgress.contentResourceId, options.lessonId))
				}
			} else {
				await client.insert(resourceProgress).values({
					userId: options.userId,
					contentResourceId: options.lessonId,
					completedAt: now,
					updatedAt: now,
				})
			}
			lessonProgress = await client.query.resourceProgress.findFirst({
				where: and(
					eq(resourceProgress.userId, options.userId),
					eq(resourceProgress.contentResourceId, options.lessonId),
				),
			})
			const parsedLessonProgress =
				resourceProgressSchema.safeParse(lessonProgress)

			if (!parsedLessonProgress.success) {
				console.error('Error parsing lesson progress', lessonProgress)
				return null
			}

			return parsedLessonProgress.data
		},
		async couponForIdOrCode(options: {
			code?: string
			couponId?: string
		}): Promise<(Coupon & { merchantCoupon: MerchantCoupon }) | null> {
			if (!options.couponId && !options.code) return null
			const couponForIdOrCode = await client.query.coupon.findFirst({
				where: or(
					and(
						or(
							options.code ? eq(coupon.code, options.code) : undefined,
							options.couponId ? eq(coupon.id, options.couponId) : undefined,
						),
						gte(coupon.expires, new Date()),
					),
					and(
						or(
							options.code ? eq(coupon.code, options.code) : undefined,
							options.couponId ? eq(coupon.id, options.couponId) : undefined,
						),
						isNull(coupon.expires),
					),
				),
				with: {
					merchantCoupon: true,
				},
			})

			if (!couponForIdOrCode) return null

			return couponSchema
				.extend({
					merchantCoupon: merchantCouponSchema,
				})
				.parse(couponForIdOrCode)
		},
		async createMerchantChargeAndPurchase(options): Promise<Purchase> {
			const purchaseId = await client.transaction(async (trx) => {
				try {
					const {
						userId,
						stripeChargeId,
						stripeCouponId,
						merchantAccountId,
						merchantProductId,
						merchantCustomerId,
						productId,
						stripeChargeAmount,
						quantity = 1,
						checkoutSessionId,
						appliedPPPStripeCouponId,
						upgradedFromPurchaseId,
						country,
						usedCouponId,
					} = options

					const existingMerchantCharge = merchantChargeSchema.nullable().parse(
						(await client.query.merchantCharge.findFirst({
							where: eq(merchantCharge.identifier, stripeChargeId),
						})) || null,
					)

					const existingPurchaseForCharge = existingMerchantCharge
						? await client.query.purchases.findFirst({
								where: eq(
									purchaseTable.merchantChargeId,
									existingMerchantCharge.id,
								),
								with: {
									user: true,
									product: true,
									bulkCoupon: true,
								},
							})
						: null

					if (existingPurchaseForCharge) {
						return existingPurchaseForCharge.id
					}

					const merchantChargeId = `mc_${v4()}`
					const purchaseId = `purch_${v4()}`

					const newMerchantCharge = await client.insert(merchantCharge).values({
						id: merchantChargeId,
						userId,
						identifier: stripeChargeId,
						merchantAccountId,
						merchantProductId,
						merchantCustomerId,
					})

					const existingPurchase = purchaseSchema.nullable().parse(
						(await client.query.purchases.findFirst({
							where: and(
								eq(purchaseTable.productId, productId),
								eq(purchaseTable.userId, userId),
								inArray(purchaseTable.status, ['Valid', 'Restricted']),
							),
						})) || null,
					)

					const existingBulkCoupon = couponSchema.nullable().parse(
						await client
							.select()
							.from(coupon)
							.leftJoin(
								purchaseTable,
								and(
									eq(coupon.id, purchaseTable.bulkCouponId),
									eq(purchaseTable.userId, userId),
								),
							)
							.where(
								and(
									eq(coupon.restrictedToProductId, productId),
									eq(purchaseTable.userId, userId),
								),
							)
							.then((res) => {
								console.log({ res })
								return res[0]?.coupons ?? null
							}),
					)

					console.log({ existingBulkCoupon })

					const isBulkPurchase =
						quantity > 1 ||
						Boolean(existingBulkCoupon) ||
						options.bulk ||
						Boolean(existingPurchase?.status === 'Valid')

					let bulkCouponId: string | null = null
					let couponToUpdate = null

					if (isBulkPurchase) {
						bulkCouponId =
							existingBulkCoupon !== null ? existingBulkCoupon.id : v4()

						if (existingBulkCoupon !== null) {
							couponToUpdate = await client
								.update(coupon)
								.set({
									maxUses: (existingBulkCoupon?.maxUses || 0) + quantity,
								})
								.where(eq(coupon.id, bulkCouponId))
						} else {
							const merchantCouponToUse = stripeCouponId
								? merchantCouponSchema.nullable().parse(
										await client.query.merchantCoupon.findFirst({
											where: eq(merchantCoupon.identifier, stripeCouponId),
										}),
									)
								: null

							couponToUpdate = await client.insert(coupon).values({
								id: bulkCouponId as string,
								percentageDiscount: '1.0',
								restrictedToProductId: productId,
								maxUses: quantity,
								status: 1,
								...(merchantCouponToUse
									? {
											merchantCouponId: merchantCouponToUse.id,
										}
									: {}),
							})
						}
					}

					const merchantSessionId = `ms_${v4()}`

					const newMerchantSession = await client
						.insert(merchantSession)
						.values({
							id: merchantSessionId,
							identifier: checkoutSessionId,
							merchantAccountId,
						})

					console.log({ newMerchantSession })

					const merchantCouponUsed = stripeCouponId
						? await client.query.merchantCoupon.findFirst({
								where: eq(merchantCoupon.identifier, stripeCouponId),
							})
						: null

					console.log({ merchantCouponUsed })

					const pppMerchantCoupon = appliedPPPStripeCouponId
						? await client.query.merchantCoupon.findFirst({
								where: and(
									eq(merchantCoupon.identifier, appliedPPPStripeCouponId),
									eq(merchantCoupon.type, 'ppp'),
								),
							})
						: null

					console.log({ pppMerchantCoupon })

					const newPurchaseStatus =
						merchantCouponUsed?.type === 'ppp' || pppMerchantCoupon
							? 'Restricted'
							: 'Valid'

					const newPurchase = await client.insert(purchaseTable).values({
						id: purchaseId,
						status: newPurchaseStatus,
						userId,
						productId,
						merchantChargeId,
						totalAmount: (stripeChargeAmount / 100).toFixed(),
						bulkCouponId,
						merchantSessionId,
						country,
						upgradedFromId: upgradedFromPurchaseId || null,
						couponId: usedCouponId || null,
					})

					console.log({ newPurchase })

					const oneWeekInMilliseconds = 1000 * 60 * 60 * 24 * 7

					const newPurchaseUserTransfer = await client
						.insert(purchaseUserTransfer)
						.values({
							id: `put_${v4()}`,
							purchaseId: purchaseId as string,
							expiresAt: existingPurchase
								? new Date()
								: new Date(Date.now() + oneWeekInMilliseconds),
							sourceUserId: userId,
						})

					console.log({ newPurchaseUserTransfer })

					// const result = await Promise.all([
					// 	newMerchantCharge,
					// 	newPurchase,
					// 	newPurchaseUserTransfer,
					// 	newMerchantSession,
					// 	...(couponToUpdate ? [couponToUpdate] : []),
					// ])
					//
					// console.log('result', { result })

					console.log('inside', { purchaseId })

					return purchaseId
				} catch (error) {
					console.error(error)
					trx.rollback()
					throw error
				}
			})

			console.log('putside', { purchaseId })

			const parsedPurchase = purchaseSchema.safeParse(
				await client.query.purchases.findFirst({
					where: eq(purchaseTable.id, purchaseId as string),
				}),
			)

			if (!parsedPurchase.success) {
				console.error(
					'Error parsing purchase',
					parsedPurchase,
					JSON.stringify(parsedPurchase, null, 2),
				)
				throw new Error('Error parsing purchase')
			}

			return parsedPurchase.data
		},
		async findOrCreateMerchantCustomer(options: {
			user: User
			identifier: string
			merchantAccountId: string
		}): Promise<MerchantCustomer | null> {
			const merchantCustomer = merchantCustomerSchema
				.nullable()
				.optional()
				.parse(
					await client.query.merchantCustomer.findFirst({
						where: (merchantCustomer, { eq }) =>
							eq(merchantCustomer.identifier, options.identifier),
					}),
				)

			if (merchantCustomer) {
				return merchantCustomer
			}

			return await adapter.createMerchantCustomer({
				identifier: options.identifier,
				merchantAccountId: options.merchantAccountId,
				userId: options.user.id,
			})
		},
		async findOrCreateUser(
			email: string,
			name?: string | null,
		): Promise<{
			user: User
			isNewUser: boolean
		}> {
			const user = await adapter.getUserByEmail?.(email)

			if (!user) {
				const newUser = await adapter.createUser?.({
					id: `u_${v4()}`,
					email,
					name,
					emailVerified: null,
				})
				if (!newUser) {
					throw new Error('Could not create user')
				}
				return {
					user: newUser as User,
					isNewUser: true,
				}
			}

			return {
				user: user as User,
				isNewUser: false,
			}
		},
		async getCoupon(couponIdOrCode: string): Promise<Coupon | null> {
			return couponSchema.nullable().parse(
				await client
					.select()
					.from(coupon)
					.where(
						or(eq(coupon.id, couponIdOrCode), eq(coupon.code, couponIdOrCode)),
					)
					.then((res) => res[0] ?? null),
			)
		},
		getCouponWithBulkPurchases(couponId: string): Promise<
			| (Coupon & {
					bulkCouponPurchases: { bulkCouponId: string }[]
			  })
			| null
		> {
			throw new Error('Method not implemented.')
		},
		async getDefaultCoupon(productIds?: string[]): Promise<{
			defaultMerchantCoupon: MerchantCoupon
			defaultCoupon: Coupon
		} | null> {
			const activeSaleCoupon = await client.query.coupon.findFirst({
				where: and(
					eq(coupon.status, 1),
					eq(coupon.default, true),
					gte(coupon.expires, new Date()),
					or(
						productIds
							? inArray(coupon.restrictedToProductId, productIds)
							: undefined,
						isNull(coupon.restrictedToProductId),
					),
				),
				orderBy: desc(coupon.percentageDiscount),
				with: {
					merchantCoupon: true,
					product: true,
				},
			})
			if (activeSaleCoupon) {
				const { restrictedToProductId } = activeSaleCoupon
				const validForProdcutId = restrictedToProductId
					? productIds?.includes(restrictedToProductId as string)
					: true

				const { merchantCoupon: defaultMerchantCoupon, ...defaultCoupon } =
					activeSaleCoupon

				if (validForProdcutId) {
					return {
						defaultMerchantCoupon: merchantCouponSchema.parse(
							defaultMerchantCoupon,
						),
						defaultCoupon: couponSchema.parse(defaultCoupon),
					}
				}
			}
			return null
		},
		getLessonProgressCountsByDate(): Promise<
			{
				count: number
				completedAt: string
			}[]
		> {
			throw new Error('Method not implemented.')
		},
		async getLessonProgressForUser(
			userId: string,
		): Promise<ResourceProgress[]> {
			const userProgress = await client.query.resourceProgress.findMany({
				where: eq(resourceProgress.userId, userId),
			})
			const parsed = z.array(resourceProgressSchema).safeParse(userProgress)
			if (!parsed.success) {
				console.error('Error parsing user progress', userProgress)
				return []
			}
			return parsed.data
		},
		async getModuleProgressForUser(
			userIdOrEmail: string,
			moduleIdOrSlug: string,
		): Promise<ModuleProgress> {
			const module = await client.query.contentResource.findFirst({
				where: or(
					eq(contentResource.id, moduleIdOrSlug),
					eq(
						sql`JSON_EXTRACT (${contentResource.fields}, "$.slug")`,
						moduleIdOrSlug,
					),
				),
				with: {
					resources: {
						orderBy: asc(contentResourceResource.position),
					},
				},
			})

			const parsedModule = ContentResourceSchema.parse(module)

			const moduleResources =
				await client.query.contentResourceResource.findMany({
					where: inArray(
						contentResourceResource.resourceOfId,
						parsedModule.resources?.map((r) => r.resourceId) ?? [],
					),
					orderBy: asc(contentResourceResource.position),
				})

			const parsedModuleResources = z
				.array(ContentResourceResourceSchema)
				.safeParse(moduleResources)

			if (!parsedModuleResources.success) {
				console.error(
					'Error parsing module resources',
					parsedModuleResources.error,
				)
				return {
					completedLessons: [],
					nextResource: null,
					percentCompleted: 0,
					completedLessonsCount: 0,
					totalLessonsCount: 0,
				}
			}

			const user = await client.query.users.findFirst({
				where: or(eq(users.id, userIdOrEmail), eq(users.email, userIdOrEmail)),
			})

			if (!user) {
				console.error('User not found', userIdOrEmail)
				return {
					completedLessons: [],
					nextResource: null,
					percentCompleted: 0,
					completedLessonsCount: 0,
					totalLessonsCount: parsedModuleResources.data.length,
				}
			}

			const parsedUser = userSchema.parse(user)

			const userProgress = await client.query.resourceProgress.findMany({
				where: and(
					eq(resourceProgress.userId, parsedUser.id),
					isNotNull(resourceProgress.completedAt),
					inArray(
						resourceProgress.contentResourceId,
						parsedModuleResources.data.map((r) => r.resourceId),
					),
				),
				orderBy: asc(resourceProgress.completedAt),
			})

			const nextResourceId = moduleResources.find(
				(r) => !userProgress.find((p) => p.contentResourceId === r.resourceId),
			)?.resourceId

			const nextResource = await client.query.contentResource.findFirst({
				where: eq(contentResource.id, nextResourceId as string),
			})

			const parsedNextResource =
				ContentResourceSchema.nullable().parse(nextResource)

			const parsedProgress = z
				.array(resourceProgressSchema)
				.safeParse(userProgress)
			if (!parsedProgress.success) {
				console.error('Error parsing user progress', parsedProgress.error)
				return {
					completedLessons: [],
					nextResource: null,
					percentCompleted: 0,
					completedLessonsCount: 0,
					totalLessonsCount: parsedModuleResources.data.length,
				}
			}
			const percentCompleted = Math.round(
				(parsedProgress.data.length / parsedModuleResources.data.length) * 100,
			)

			return {
				completedLessons: parsedProgress.data,
				nextResource: parsedNextResource,
				percentCompleted,
				completedLessonsCount: parsedProgress.data.length,
				totalLessonsCount: parsedModuleResources.data.length,
			}
		},
		getLessonProgresses(): Promise<ResourceProgress[]> {
			throw new Error('Method not implemented.')
		},
		async getMerchantCharge(
			merchantChargeId: string,
		): Promise<MerchantCharge | null> {
			const mCharge = await client.query.merchantCharge.findFirst({
				where: eq(merchantCharge.id, merchantChargeId),
			})
			console.log('mCharge', mCharge)
			const parsed = merchantChargeSchema.safeParse(mCharge)
			if (!parsed.success) {
				console.error('Error parsing merchantCharge', mCharge)
				return null
			}
			return parsed.data
		},
		async getMerchantCouponsForTypeAndPercent(params: {
			type: string
			percentageDiscount: number
		}): Promise<MerchantCoupon[]> {
			return z.array(merchantCouponSchema).parse(
				await client.query.merchantCoupon.findMany({
					where: and(
						eq(merchantCoupon.type, params.type),
						eq(
							merchantCoupon.percentageDiscount,
							params.percentageDiscount.toString(),
						),
					),
				}),
			)
		},
		async getMerchantCouponForTypeAndPercent(params: {
			type: string
			percentageDiscount: number
		}): Promise<MerchantCoupon | null> {
			const foundMerchantCoupon = await client.query.merchantCoupon.findFirst({
				where: and(
					eq(merchantCoupon.type, params.type),
					eq(
						merchantCoupon.percentageDiscount,
						params.percentageDiscount.toString(),
					),
				),
			})

			const parsed = merchantCouponSchema
				.nullable()
				.safeParse(foundMerchantCoupon)
			if (parsed.success) {
				return parsed.data
			}

			return null
		},
		async getMerchantCoupon(
			merchantCouponId: string,
		): Promise<MerchantCoupon | null> {
			const foundMerchantCoupon = await client.query.merchantCoupon.findFirst({
				where: eq(merchantCoupon.id, merchantCouponId),
			})

			const parsed = merchantCouponSchema
				.nullable()
				.safeParse(foundMerchantCoupon)
			if (parsed.success) {
				return parsed.data
			}

			return null
		},
		async getMerchantProduct(
			stripeProductId: string,
		): Promise<MerchantProduct | null> {
			return merchantProductSchema.nullable().parse(
				await client.query.merchantProduct.findFirst({
					where: eq(merchantProduct.identifier, stripeProductId),
				}),
			)
		},
		getPrice(productId: string): Promise<Price | null> {
			throw new Error('Method not implemented.')
		},
		async getPriceForProduct(productId: string): Promise<Price | null> {
			return priceSchema.nullable().parse(
				await client.query.prices.findFirst({
					where: eq(prices.productId, productId),
				}),
			)
		},
		async getProduct(productId: string): Promise<Product | null> {
			return productSchema.nullable().parse(
				await client.query.products.findFirst({
					where: eq(products.id, productId),
				}),
			)
		},
		async getPurchase(purchaseId: string): Promise<Purchase | null> {
			const purchase = await client.query.purchases.findFirst({
				where: eq(purchaseTable.id, purchaseId),
			})

			return purchase ? purchaseSchema.parse(purchase) : null
		},
		async createPurchase(options): Promise<Purchase> {
			const newPurchaseId = options.id || `purchase-${v4()}`
			await client.insert(purchaseTable).values({
				...options,
				id: newPurchaseId,
			})

			const newPurchase = await adapter.getPurchase(newPurchaseId)

			return purchaseSchema.parse(newPurchase)
		},

		async getPurchaseForStripeCharge(
			stripeChargeId: string,
		): Promise<Purchase | null> {
			const purchase = purchaseSchema.safeParse(
				await client
					.select()
					.from(purchaseTable)
					.leftJoin(
						merchantCharge,
						and(
							eq(merchantCharge.identifier, stripeChargeId),
							eq(merchantCharge.id, purchaseTable.merchantChargeId),
						),
					)
					.then((res) => {
						return res[0]?.purchases ?? null
					}),
			)

			if (!purchase.success) {
				return null
			}

			return purchase.data
		},
		getPurchaseUserTransferById(options: { id: string }): Promise<
			| (PurchaseUserTransfer & {
					sourceUser: User
					targetUser: User | null
					purchase: Purchase
			  })
			| null
		> {
			throw new Error('Method not implemented.')
		},
		getPurchaseWithUser(purchaseId: string): Promise<
			| (Purchase & {
					user: User
			  })
			| null
		> {
			throw new Error('Method not implemented.')
		},
		async getPurchasesForUser(userId?: string): Promise<Purchase[]> {
			if (!userId) {
				return []
			}

			const visiblePurchaseStates = ['Valid', 'Refunded', 'Restricted']

			const userPurchases = await client.query.purchases.findMany({
				where: and(
					eq(purchaseTable.userId, userId),
					inArray(purchaseTable.status, visiblePurchaseStates),
				),
				with: {
					user: true,
					product: true,
					bulkCoupon: true,
				},
				orderBy: asc(purchaseTable.createdAt),
			})

			const parsedPurchases = z.array(purchaseSchema).safeParse(userPurchases)

			if (!parsedPurchases.success) {
				console.error(
					'Error parsing purchases',
					JSON.stringify(parsedPurchases.error),
				)
				return []
			}

			return parsedPurchases.data
		},
		async getPurchaseDetails(
			purchaseId: string,
			userId: string,
		): Promise<{
			purchase?: Purchase
			existingPurchase?: Purchase & { product?: Product | null }
			availableUpgrades: UpgradableProduct[]
		}> {
			const visiblePurchaseStates = ['Valid', 'Refunded', 'Restricted']

			const userPurchases = await client.query.purchases.findMany({
				where: and(
					eq(purchaseTable.userId, userId),
					inArray(purchaseTable.status, visiblePurchaseStates),
				),
				with: {
					user: true,
					product: true,
					bulkCoupon: true,
				},
				orderBy: asc(purchaseTable.createdAt),
			})

			const parsedPurchases = z.array(purchaseSchema).safeParse(userPurchases)

			const allPurchases = parsedPurchases.success ? parsedPurchases.data : []

			console.log('🦦', { allPurchases })

			const thePurchase = await client.query.purchases.findFirst({
				where: and(
					eq(purchaseTable.id, purchaseId),
					eq(purchaseTable.userId, userId),
				),
				with: {
					user: true,
					product: true,
					bulkCoupon: true,
				},
			})

			const parsedPurchase = purchaseSchema.safeParse(thePurchase)

			if (!parsedPurchase.success) {
				console.error('Error parsing purchase', parsedPurchase)
				return {
					availableUpgrades: [],
				}
			}

			console.log('🦦', { parsedPurchase: parsedPurchase.data })

			const purchaseCanUpgrade = ['Valid', 'Restricted'].includes(
				parsedPurchase.data.state || '',
			)

			let availableUpgrades: any[] = []

			if (purchaseCanUpgrade) {
				availableUpgrades = await client.query.upgradableProducts.findMany({
					where: and(
						eq(
							upgradableProducts.upgradableFromId,
							parsedPurchase.data.product?.id as string,
						),
						not(
							inArray(
								upgradableProducts.upgradableToId,
								allPurchases.map((p) => p.product?.id as string),
							),
						),
					),
					with: {
						upgradableTo: true,
						upgradableFrom: true,
					},
				})
			}

			const existingPurchase = allPurchases.find(
				(p) => p.productId === parsedPurchase.data.productId,
			)

			console.log('💀 existingPurchase', existingPurchase)

			return {
				availableUpgrades: z
					.array(upgradableProductSchema)
					.parse(availableUpgrades),
				existingPurchase,
				purchase: parsedPurchase.data,
			}
		},
		async getUserById(userId: string): Promise<User | null> {
			return userSchema.nullable().parse(
				await client.query.users.findFirst({
					where: eq(users.id, userId),
				}),
			)
		},
		async pricesOfPurchasesTowardOneBundle({
			userId,
			bundleId,
		}: {
			userId: string | undefined
			bundleId: string
		}): Promise<Price[]> {
			if (userId === undefined) return []

			const canUpgradeProducts = await client.query.upgradableProducts.findMany(
				{
					where: eq(upgradableProducts.upgradableToId, bundleId),
				},
			)

			const upgradableFrom = z.array(z.string()).parse(
				canUpgradeProducts.map((product) => {
					return product.upgradableFromId
				}),
			)

			const purchases = await client.query.purchases.findMany({
				where: and(
					eq(purchaseTable.userId, userId),
					inArray(purchaseTable.productId, upgradableFrom),
				),
			})

			const productsPurchased = z.array(z.string()).parse(
				purchases.map((purchase) => {
					return purchase.productId
				}),
			)

			if (productsPurchased.length === 0) return []

			const foundPrices = await client.query.prices.findMany({
				where: inArray(prices.productId, productsPurchased),
			})

			return z.array(priceSchema).parse(foundPrices)
		},
		async toggleLessonProgressForUser(options: {
			userId: string
			lessonId?: string
		}): Promise<ResourceProgress | null> {
			if (!options.lessonId) {
				throw new Error('No lessonId provided')
			}

			let lessonProgress = await client.query.resourceProgress.findFirst({
				where: and(
					eq(resourceProgress.userId, options.userId),
					eq(resourceProgress.contentResourceId, options.lessonId),
				),
			})

			const now = new Date()

			if (lessonProgress) {
				await client
					.update(resourceProgress)
					.set({
						completedAt: lessonProgress.completedAt ? null : now,
						updatedAt: now,
					})
					.where(eq(resourceProgress.contentResourceId, options.lessonId))
			} else {
				await client.insert(resourceProgress).values({
					userId: options.userId,
					contentResourceId: options.lessonId,
					completedAt: now,
					updatedAt: now,
				})
			}

			lessonProgress = await client.query.resourceProgress.findFirst({
				where: and(
					eq(resourceProgress.userId, options.userId),
					eq(resourceProgress.contentResourceId, options.lessonId),
				),
			})

			const parsedLessonProgress =
				resourceProgressSchema.safeParse(lessonProgress)

			if (!parsedLessonProgress.success) {
				console.error('Error parsing lesson progress', lessonProgress)
				return null
			}

			return parsedLessonProgress.data
		},
		transferPurchasesToNewUser(options: {
			merchantCustomerId: string
			userId: string
		}): Promise<unknown> {
			throw new Error('Method not implemented.')
		},
		updatePurchaseStatusForCharge(
			chargeId: string,
			status: 'Valid' | 'Refunded' | 'Disputed' | 'Banned' | 'Restricted',
		): Promise<Purchase | undefined> {
			throw new Error('Method not implemented.')
		},
		updatePurchaseUserTransferTransferState(options: {
			id: string
			transferState: PurchaseUserTransferState
		}): Promise<PurchaseUserTransfer | null> {
			throw new Error('Method not implemented.')
		},
		addResourceToResource: async function (options) {
			const { parentResourceId, childResourceId } = options

			const parentResourceData = await client.query.contentResource.findFirst({
				where: or(
					eq(
						sql`JSON_EXTRACT (${contentResource.fields}, "$.slug")`,
						parentResourceId,
					),
					eq(contentResource.id, parentResourceId),
				),
				with: {
					resources: true,
				},
			})

			const parentResource = ContentResourceSchema.parse(parentResourceData)

			await client.insert(contentResourceResource).values({
				resourceOfId: parentResource.id,
				resourceId: childResourceId,
				position: parentResource.resources?.length || 0,
			})

			const resourceJoin = client.query.contentResourceResource.findFirst({
				where: and(
					eq(contentResourceResource.resourceOfId, parentResourceId),
					eq(contentResourceResource.resourceId, childResourceId),
				),
				with: {
					resource: true,
				},
			})

			const parsedResourceJoin =
				ContentResourceResourceSchema.safeParse(resourceJoin)
			if (!parsedResourceJoin.success) {
				return null
			}

			return parsedResourceJoin.data
		},
		async updateContentResourceFields(options) {
			if (!options.id) {
				throw new Error('No content resource id.')
			}

			const currentResource = await client
				.select()
				.from(contentResource)
				.where(eq(contentResource.id, options.id))
				.then((res) => res[0])

			await client
				.update(contentResource)
				.set({ fields: { ...currentResource.fields, ...options.fields } })
				.where(eq(contentResource.id, options.id))

			const resource = await client.query.contentResource.findFirst({
				where: eq(contentResource.id, options.id),
				with: {
					resources: {
						with: {
							resource: {
								with: {
									resources: {
										with: {
											resource: true,
										},
										orderBy: asc(contentResourceResource.position),
									},
								},
							},
						},
						orderBy: asc(contentResourceResource.position),
					},
				},
			})

			const parsedResource = ContentResourceSchema.safeParse(resource)

			if (!parsedResource.success) {
				console.error('Error parsing resource', resource)
				return null
			}

			return parsedResource.data
		},
		async getVideoResource(id) {
			if (!id) {
				return null
			}

			const query = sql`
    SELECT
      id as id,
      CAST(updatedAt AS DATETIME) as updatedAt,
      CAST(createdAt AS DATETIME) as createdAt,
      JSON_EXTRACT (${contentResource.fields}, "$.state") AS state,
      JSON_EXTRACT (${contentResource.fields}, "$.duration") AS duration,
      JSON_EXTRACT (${contentResource.fields}, "$.muxPlaybackId") AS muxPlaybackId,
      JSON_EXTRACT (${contentResource.fields}, "$.muxAssetId") AS muxAssetId,
      JSON_EXTRACT (${contentResource.fields}, "$.transcript") AS transcript
    FROM
      ${contentResource}
    WHERE
      type = 'videoResource'
      AND (id = ${id});

 `
			return client
				.execute(query)
				.then((result: any) => {
					const parsedResource = VideoResourceSchema.safeParse(result.rows[0])
					return parsedResource.success ? parsedResource.data : null
				})
				.catch((error) => {
					console.error(error)
					throw error
				})
		},
		async createContentResource(data) {
			const id = data.id || crypto.randomUUID()

			await client.insert(contentResource).values({ ...data, id })

			const resource = await client.query.contentResource.findFirst({
				where: eq(contentResource.id, id),
				with: {
					resources: {
						with: {
							resource: {
								with: {
									resources: {
										with: {
											resource: true,
										},
										orderBy: asc(contentResourceResource.position),
									},
								},
							},
						},
						orderBy: asc(contentResourceResource.position),
					},
				},
			})

			const parsedResource = ContentResourceSchema.safeParse(resource)

			if (!parsedResource.success) {
				console.error('Error parsing resource', resource)
				throw new Error('Error parsing resource')
			}

			return parsedResource.data
		},
		async getContentResource(data) {
			const resource = await client.query.contentResource.findFirst({
				where: or(
					eq(contentResource.id, data),
					eq(
						sql`JSON_EXTRACT (${contentResource.fields}, "$.slug")`,
						`${data}`,
					),
				),
				with: {
					resources: {
						with: {
							resource: {
								with: {
									resources: {
										with: {
											resource: true,
										},
										orderBy: asc(contentResourceResource.position),
									},
								},
							},
						},
						orderBy: asc(contentResourceResource.position),
					},
				},
			})

			const parsedResource = ContentResourceSchema.safeParse(resource)

			if (!parsedResource.success) {
				console.error('Error parsing resource', resource)
				return null
			}

			return parsedResource.data
		},
		async createUser(data) {
			try {
				const id = crypto.randomUUID()

				await client.insert(users).values({ ...data, id })

				return await client
					.select()
					.from(users)
					.where(eq(users.id, id))
					.then((res) => res[0] as AdapterUser)
			} catch (error) {
				console.error(error)
				throw error
			}
		},
		async getUser(data) {
			return (
				(await client
					.select()
					.from(users)
					.where(eq(users.id, data))
					.then((res) => res[0])) ?? null
			)
		},
		async getUserByEmail(data) {
			return (
				(await client
					.select()
					.from(users)
					.where(eq(users.email, data))
					.then((res) => res[0])) ?? null
			)
		},
		async createSession(data) {
			await client.insert(sessions).values(data)

			return await client
				.select()
				.from(sessions)
				.where(eq(sessions.sessionToken, data.sessionToken))
				.then((res) => res[0] as AdapterSession)
		},
		async getSessionAndUser(data) {
			return (
				(await client
					.select({
						session: sessions,
						user: users,
					})
					.from(sessions)
					.where(eq(sessions.sessionToken, data))
					.innerJoin(users, eq(users.id, sessions.userId))
					.then((res) => res[0])) ?? null
			)
		},
		async updateUser(data) {
			if (!data.id) {
				throw new Error('No user id.')
			}

			await client.update(users).set(data).where(eq(users.id, data.id))

			return await client
				.select()
				.from(users)
				.where(eq(users.id, data.id))
				.then((res) => res[0] as AdapterUser)
		},
		async updateSession(data) {
			await client
				.update(sessions)
				.set(data)
				.where(eq(sessions.sessionToken, data.sessionToken))

			return await client
				.select()
				.from(sessions)
				.where(eq(sessions.sessionToken, data.sessionToken))
				.then((res) => res[0])
		},
		async linkAccount(rawAccount) {
			await client.insert(accounts).values(rawAccount)
		},
		async getUserByAccount(account) {
			const dbAccount =
				(await client
					.select()
					.from(accounts)
					.where(
						and(
							eq(accounts.providerAccountId, account.providerAccountId),
							eq(accounts.provider, account.provider),
						),
					)
					.leftJoin(users, eq(accounts.userId, users.id))
					.then((res) => res[0])) ?? null

			if (!dbAccount) {
				return null
			}

			return dbAccount.user
		},
		async deleteSession(sessionToken) {
			const session =
				(await client
					.select()
					.from(sessions)
					.where(eq(sessions.sessionToken, sessionToken))
					.then((res) => res[0])) ?? null

			await client
				.delete(sessions)
				.where(eq(sessions.sessionToken, sessionToken))

			return session
		},
		async createVerificationToken(token) {
			await client.insert(verificationTokens).values(token)

			return await client
				.select()
				.from(verificationTokens)
				.where(eq(verificationTokens.identifier, token.identifier))
				.then((res) => res[0])
		},
		async useVerificationToken(token) {
			try {
				const deletedToken =
					(await client
						.select()
						.from(verificationTokens)
						.where(
							and(
								eq(verificationTokens.identifier, token.identifier),
								eq(verificationTokens.token, token.token),
							),
						)
						.then((res) => res[0])) ?? null

				if (deletedToken?.createdAt) {
					const TIMEOUT_IN_SECONDS = 90
					const expireMultipleClicks = addSeconds(
						deletedToken.createdAt,
						TIMEOUT_IN_SECONDS,
					)
					const now = new Date()

					if (isAfter(expireMultipleClicks, now)) {
						// @ts-ignore
						const { id: _, ...verificationToken } = token
						return deletedToken
					} else {
						await client
							.delete(verificationTokens)
							.where(
								and(
									eq(verificationTokens.identifier, token.identifier),
									eq(verificationTokens.token, token.token),
								),
							)
						return deletedToken
					}
				}

				return deletedToken
			} catch (err) {
				throw new Error('No verification token found.')
			}
		},
		async deleteUser(id) {
			const user = await client
				.select()
				.from(users)
				.where(eq(users.id, id))
				.then((res) => res[0] ?? null)

			await client.delete(users).where(eq(users.id, id))
			await client.delete(sessions).where(eq(sessions.userId, id))
			await client.delete(accounts).where(eq(accounts.userId, id))

			return user
		},
		async unlinkAccount(account) {
			await client
				.delete(accounts)
				.where(
					and(
						eq(accounts.providerAccountId, account.providerAccountId),
						eq(accounts.provider, account.provider),
					),
				)

			return undefined
		},
	}

	return adapter
}
