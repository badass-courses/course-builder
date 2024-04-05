import type { AdapterSession, AdapterUser } from '@auth/core/adapters'
import { addSeconds, isAfter } from 'date-fns'
import { and, asc, eq, inArray, not, notInArray, or, sql } from 'drizzle-orm'
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
	MerchantCoupon,
	MerchantCustomer,
	MerchantProduct,
	Price,
	Product,
	Purchase,
	purchaseSchema,
	PurchaseUserTransfer,
	PurchaseUserTransferState,
	ResourceProgress,
	UpgradableProduct,
	upgradableProductSchema,
	User,
} from '@coursebuilder/core/schemas'
import {
	ContentResourceResourceSchema,
	ContentResourceSchema,
} from '@coursebuilder/core/schemas/content-resource-schema'
import { VideoResourceSchema } from '@coursebuilder/core/schemas/video-resource'

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
import { getCouponSchema } from './schemas/commerce/coupon.js'
import { getMerchantAccountSchema } from './schemas/commerce/merchant-account.js'
import { getMerchantChargeSchema } from './schemas/commerce/merchant-charge.js'
import { getMerchantCouponSchema } from './schemas/commerce/merchant-coupon.js'
import { getMerchantCustomerSchema } from './schemas/commerce/merchant-customer.js'
import { getMerchantPriceSchema } from './schemas/commerce/merchant-price.js'
import { getMerchantProductSchema } from './schemas/commerce/merchant-product.js'
import { getMerchantSessionSchema } from './schemas/commerce/merchant-session.js'
import { getPriceSchema } from './schemas/commerce/price.js'
import { getProductSchema } from './schemas/commerce/product.js'
import { getPurchaseUserTransferSchema } from './schemas/commerce/purchase-user-transfer.js'
import { getPurchaseSchema } from './schemas/commerce/purchase.js'
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
		merchantAccount: getMerchantAccountSchema(mysqlTable),
		merchantCharge: getMerchantChargeSchema(mysqlTable),
		merchantCoupon: getMerchantCouponSchema(mysqlTable),
		merchantCustomer: getMerchantCustomerSchema(mysqlTable),
		merchantPrice: getMerchantPriceSchema(mysqlTable),
		merchantProduct: getMerchantProductSchema(mysqlTable),
		merchantSession: getMerchantSessionSchema(mysqlTable),
		price: getPriceSchema(mysqlTable),
		product: getProductSchema(mysqlTable),
		purchase: getPurchaseSchema(mysqlTable),
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
	} as const
}

export function createTables(mySqlTable: MySqlTableFn) {
	return getCourseBuilderSchema(mySqlTable)
}

export type DefaultSchema = ReturnType<typeof createTables>

export function mySqlDrizzleAdapter(
	client: InstanceType<typeof MySqlDatabase>,
	tableFn = defaultMySqlTableFn,
): CourseBuilderAdapter {
	const {
		users,
		accounts,
		sessions,
		verificationTokens,
		contentResource,
		contentResourceResource,
		purchase,
		purchaseUserTransfer,
		coupon,
		merchantCoupon,
		merchantCharge,
		merchantAccount,
		merchantPrice,
		merchantCustomer,
		merchantSession,
		merchantProduct,
		price,
		product,
		upgradableProducts,
	} = createTables(tableFn)

	return {
		availableUpgradesForProduct(
			purchases: any,
			productId: string,
		): Promise<
			{
				upgradableTo: { id: string; name: string }
				upgradableFrom: { id: string; name: string }
			}[]
		> {
			throw new Error('Method not implemented.')
		},
		clearLessonProgressForUser(options: {
			userId: string
			lessons: { id: string; slug: string }[]
		}): Promise<void> {
			throw new Error('Method not implemented.')
		},
		completeLessonProgressForUser(options: {
			userId: string
			lessonId?: string
		}): Promise<ResourceProgress | null> {
			throw new Error('Method not implemented.')
		},
		couponForIdOrCode(options: {
			code?: string
			couponId?: string
		}): Promise<(Coupon & { merchantCoupon: MerchantCoupon }) | null> {
			throw new Error('Method not implemented.')
		},
		createMerchantChargeAndPurchase(options: {
			userId: string
			productId: string
			stripeChargeId: string
			stripeCouponId?: string
			merchantAccountId: string
			merchantProductId: string
			merchantCustomerId: string
			stripeChargeAmount: number
			quantity?: number
			bulk?: boolean
			checkoutSessionId: string
			appliedPPPStripeCouponId: string | undefined
			upgradedFromPurchaseId: string | undefined
			usedCouponId: string | undefined
			country?: string
		}): Promise<Purchase> {
			throw new Error('Method not implemented.')
		},
		findOrCreateMerchantCustomer(options: {
			user: User
			identifier: string
			merchantAccountId: string
		}): Promise<MerchantCustomer | null> {
			throw new Error('Method not implemented.')
		},
		findOrCreateUser(
			email: string,
			name?: string | null,
		): Promise<{
			user: User
			isNewUser: boolean
		}> {
			throw new Error('Method not implemented.')
		},
		getCoupon(couponIdOrCode: string): Promise<Coupon | null> {
			throw new Error('Method not implemented.')
		},
		getCouponWithBulkPurchases(couponId: string): Promise<
			| (Coupon & {
					bulkCouponPurchases: { bulkCouponId: string }[]
			  })
			| null
		> {
			throw new Error('Method not implemented.')
		},
		getDefaultCoupon(productIds?: string[]): Promise<{
			defaultMerchantCoupon: MerchantCoupon
			defaultCoupon: Coupon
		} | null> {
			throw new Error('Method not implemented.')
		},
		getLessonProgressCountsByDate(): Promise<
			{
				count: number
				completedAt: string
			}[]
		> {
			throw new Error('Method not implemented.')
		},
		getLessonProgressForUser(userId: string): Promise<ResourceProgress[]> {
			throw new Error('Method not implemented.')
		},
		getLessonProgresses(): Promise<ResourceProgress[]> {
			throw new Error('Method not implemented.')
		},
		getMerchantCharge(merchantChargeId: string): Promise<{
			id: string
			identifier: string
			merchantProductId: string
		} | null> {
			throw new Error('Method not implemented.')
		},
		getMerchantCoupon(
			merchantCouponId: string,
		): Promise<MerchantCoupon | null> {
			throw new Error('Method not implemented.')
		},
		getMerchantProduct(
			stripeProductId: string,
		): Promise<MerchantProduct | null> {
			throw new Error('Method not implemented.')
		},
		getPrice(productId: string): Promise<Price | null> {
			throw new Error('Method not implemented.')
		},
		getProduct(productId: string): Promise<Product | null> {
			throw new Error('Method not implemented.')
		},
		getPurchase(purchaseId: string): Promise<Purchase | null> {
			throw new Error('Method not implemented.')
		},
		async createPurchase(options: Omit<Purchase, 'id'>): Promise<Purchase> {
			const newPurchaseId = v4()
			await client.insert(purchase).values({
				id: newPurchaseId,
				...options,
			})

			const newPurchase = await client.query.purchase.findFirst({
				where: eq(purchase.id, newPurchaseId),
			})

			const parsedPurchase = purchaseSchema.safeParse(newPurchase)

			if (!parsedPurchase.success) {
				console.error(
					'purchase schema validation failed',
					JSON.stringify(parsedPurchase.error, null, 2),
				)
				throw new Error('Error creating purchase')
			}

			return parsedPurchase.data
		},
		async getPurchaseDetails(
			purchaseId: string,
			userId: string,
		): Promise<{
			purchase?: Purchase
			existingPurchase?: Purchase
			availableUpgrades: UpgradableProduct[]
		}> {
			const allPurchases = await this.getPurchasesForUser(userId)
			const thePurchase = await client.query.purchase.findFirst({
				where: and(eq(purchase.id, purchaseId), eq(purchase.userId, userId)),
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

			const purchaseCanUpgrade = ['Valid', 'Restricted'].includes(
				parsedPurchase.data.state || '',
			)

			if (!purchaseCanUpgrade) {
				return {
					availableUpgrades: [],
				}
			}

			const availableUpgrades = await client.query.upgradableProducts.findMany({
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

			const existingPurchase = allPurchases.find(
				(p) => p.product?.id === parsedPurchase.data.product?.id,
			)

			return Promise.resolve({
				availableUpgrades: z
					.array(upgradableProductSchema)
					.parse(availableUpgrades),
				existingPurchase,
				purchase: parsedPurchase.data,
			})
		},
		getPurchaseForStripeCharge(
			stripeChargeId: string,
		): Promise<Purchase | null> {
			throw new Error('Method not implemented.')
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

			const userPurchases = await client.query.purchase.findMany({
				where: and(
					eq(purchase.userId, userId),
					inArray(purchase.state, visiblePurchaseStates),
				),
				with: {
					user: true,
					product: true,
					bulkCoupon: true,
				},
				orderBy: asc(purchase.createdAt),
			})

			const parsedPurchases = z.array(purchaseSchema).safeParse(userPurchases)

			if (!parsedPurchases.success) {
				console.error('Error parsing purchases', parsedPurchases)
				return []
			}

			return parsedPurchases.data
		},
		getUserById(userId: string): Promise<User | null> {
			throw new Error('Method not implemented.')
		},
		pricesOfPurchasesTowardOneBundle(options: {
			userId: string | undefined
			bundleId: string
		}): Promise<Price[]> {
			throw new Error('Method not implemented.')
		},
		toggleLessonProgressForUser(options: {
			userId: string
			lessonId?: string
			lessonSlug?: string
		}): Promise<ResourceProgress | null> {
			throw new Error('Method not implemented.')
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
				throw new Error('videoResourceId is required')
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
					return error
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
				where: eq(contentResource.id, data),
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
			console.log(data)
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
}
