import type { AdapterSession, AdapterUser } from '@auth/core/adapters'
import { addSeconds, isAfter } from 'date-fns'
import { and, asc, eq, sql } from 'drizzle-orm'
import {
	mysqlTable as defaultMySqlTableFn,
	MySqlDatabase,
	MySqlTableFn,
} from 'drizzle-orm/mysql-core'

import { type CourseBuilderAdapter } from '@coursebuilder/core/adapters'
import { ContentResourceSchema } from '@coursebuilder/core/schemas/content-resource-schema'
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
	} = createTables(tableFn)

	return {
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
			const id = crypto.randomUUID()

			await client.insert(users).values({ ...data, id })

			return await client
				.select()
				.from(users)
				.where(eq(users.id, id))
				.then((res) => res[0] as AdapterUser)
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
