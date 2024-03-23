import type { AdapterSession, AdapterUser } from '@auth/core/adapters'
import { addSeconds, isAfter } from 'date-fns'
import { and, eq, sql } from 'drizzle-orm'
import {
	mysqlTable as defaultMySqlTableFn,
	MySqlDatabase,
	MySqlTableFn,
} from 'drizzle-orm/mysql-core'

import { type CourseBuilderAdapter } from '@coursebuilder/core/adapters'
import { VideoResourceSchema } from '@coursebuilder/core/schemas/video-resource'

import {
	getAccountsRelationsSchema,
	getAccountsSchema,
} from './schemas/auth/accounts'
import {
	getPermissionsRelationsSchema,
	getPermissionsSchema,
} from './schemas/auth/permissions'
import {
	getRolePermissionsRelationsSchema,
	getRolePermissionsSchema,
} from './schemas/auth/role-permissions'
import { getRolesRelationsSchema, getRolesSchema } from './schemas/auth/roles'
import {
	getSessionRelationsSchema,
	getSessionsSchema,
} from './schemas/auth/sessions'
import {
	getUserPermissionsRelationsSchema,
	getUserPermissionsSchema,
} from './schemas/auth/user-permissions'
import {
	getUserRolesRelationsSchema,
	getUserRolesSchema,
} from './schemas/auth/user-roles'
import { getUsersRelationsSchema, getUsersSchema } from './schemas/auth/users'
import { getVerificationTokensSchema } from './schemas/auth/verification-tokens'
import { getCouponSchema } from './schemas/commerce/coupon'
import { getMerchantAccountSchema } from './schemas/commerce/merchant-account'
import { getMerchantChargeSchema } from './schemas/commerce/merchant-charge'
import { getMerchantCouponSchema } from './schemas/commerce/merchant-coupon'
import { getMerchantCustomerSchema } from './schemas/commerce/merchant-customer'
import { getMerchantPriceSchema } from './schemas/commerce/merchant-price'
import { getMerchantProductSchema } from './schemas/commerce/merchant-product'
import { getMerchantSessionSchema } from './schemas/commerce/merchant-session'
import { getPriceSchema } from './schemas/commerce/price'
import { getProductSchema } from './schemas/commerce/product'
import { getPurchaseSchema } from './schemas/commerce/purchase'
import { getPurchaseUserTransferSchema } from './schemas/commerce/purchase-user-transfer'
import { getCommunicationChannelSchema } from './schemas/communication/communication-channel'
import { getCommunicationPreferenceTypesSchema } from './schemas/communication/communication-preference-types'
import {
	getCommunicationPreferencesRelationsSchema,
	getCommunicationPreferencesSchema,
} from './schemas/communication/communication-preferences'
import {
	getContentContributionRelationsSchema,
	getContentContributionsSchema,
} from './schemas/content/content-contributions'
import {
	getContentResourceRelationsSchema,
	getContentResourceSchema,
} from './schemas/content/content-resource'
import {
	getContentResourceResourceRelationsSchema,
	getContentResourceResourceSchema,
} from './schemas/content/content-resource-resource'
import {
	getContributionTypesRelationsSchema,
	getContributionTypesSchema,
} from './schemas/content/contribution-types'
import { getResourceProgressSchema } from './schemas/content/resource-progress'

export {
	getAccountsSchema,
	getAccountsRelationsSchema,
	getPermissionsSchema,
	getPermissionsRelationsSchema,
	getRolePermissionsSchema,
	getRolePermissionsRelationsSchema,
	getRolesSchema,
	getRolesRelationsSchema,
	getSessionsSchema,
	getSessionRelationsSchema,
	getUserPermissionsSchema,
	getUserPermissionsRelationsSchema,
	getUserRolesSchema,
	getUserRolesRelationsSchema,
	getUsersSchema,
	getUsersRelationsSchema,
	getVerificationTokensSchema,
	getCouponSchema,
	getMerchantAccountSchema,
	getMerchantChargeSchema,
	getMerchantCouponSchema,
	getMerchantCustomerSchema,
	getMerchantPriceSchema,
	getMerchantProductSchema,
	getMerchantSessionSchema,
	getPriceSchema,
	getProductSchema,
	getPurchaseSchema,
	getPurchaseUserTransferSchema,
	getContentResourceSchema,
	getContentResourceRelationsSchema,
	getContentResourceResourceSchema,
	getContentResourceResourceRelationsSchema,
	getCommunicationChannelSchema,
	getCommunicationPreferenceTypesSchema,
	getCommunicationPreferencesSchema,
	getCommunicationPreferencesRelationsSchema,
	getContentContributionsSchema,
	getContentContributionRelationsSchema,
	getContributionTypesSchema,
	getContributionTypesRelationsSchema,
	getResourceProgressSchema,
}

export function createTables(mySqlTable: MySqlTableFn) {
	return {
		users: getUsersSchema(mySqlTable),
		accounts: getAccountsSchema(mySqlTable),
		sessions: getSessionsSchema(mySqlTable),
		verificationTokens: getVerificationTokensSchema(mySqlTable),
		contentResource: getContentResourceSchema(mySqlTable),
		contentResourceResource: getContentResourceResourceSchema(mySqlTable),
		purchase: getPurchaseSchema(mySqlTable),
		price: getPriceSchema(mySqlTable),
		product: getProductSchema(mySqlTable),
		purchaseUserTransfer: getPurchaseUserTransferSchema(mySqlTable),
		merchantSession: getMerchantSessionSchema(mySqlTable),
		merchantProduct: getMerchantProductSchema(mySqlTable),
		merchantPrice: getMerchantPriceSchema(mySqlTable),
		merchantCustomer: getMerchantCustomerSchema(mySqlTable),
		merchantCoupon: getMerchantCouponSchema(mySqlTable),
		merchantCharge: getMerchantChargeSchema(mySqlTable),
		merchantAccount: getMerchantAccountSchema(mySqlTable),
		coupon: getCouponSchema(mySqlTable),
	}
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

			return await client
				.select()
				.from(contentResource)
				.where(eq(contentResource.id, options.id))
				.then((res) => res[0])
		},
		async getVideoResource(id) {
			if (!id) {
				throw new Error('videoResourceId is required')
			}

			const query = sql`
    SELECT
      id as _id,
      CAST(updatedAt AS DATETIME) as _updatedAt,
      CAST(createdAt AS DATETIME) as _createdAt,
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

			return await client
				.select()
				.from(contentResource)
				.where(eq(contentResource.id, id))
				.then((res) => res[0])
		},
		async getContentResource(data) {
			return (
				(await client
					.select()
					.from(contentResource)
					.where(eq(contentResource.id, data))
					.then((res) => res[0])) ?? null
			)
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
