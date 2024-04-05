import type { AdapterAccount } from '@auth/core/adapters'
import { and, asc, eq, sql } from 'drizzle-orm'
import {
	BaseSQLiteDatabase,
	sqliteTable as defaultSqliteTableFn,
	integer,
	primaryKey,
	SQLiteTableFn,
	text,
} from 'drizzle-orm/sqlite-core'

import { type CourseBuilderAdapter } from '@coursebuilder/core/adapters'
import {
	Coupon,
	MerchantCoupon,
	MerchantCustomer,
	MerchantProduct,
	Price,
	Product,
	Purchase,
	PurchaseUserTransfer,
	PurchaseUserTransferState,
	ResourceProgress,
	UpgradableProduct,
	User,
} from '@coursebuilder/core/schemas'
import { ContentResourceSchema } from '@coursebuilder/core/schemas/content-resource-schema'

import { stripUndefined } from './utils.js'

export function createTables(sqliteTable: SQLiteTableFn) {
	const users = sqliteTable('user', {
		id: text('id').notNull().primaryKey(),
		name: text('name'),
		role: text('role', { enum: ['user', 'admin'] }).default('user'),
		email: text('email').notNull(),
		emailVerified: integer('emailVerified', { mode: 'timestamp_ms' }),
		image: text('image'),
	})

	const accounts = sqliteTable(
		'account',
		{
			userId: text('userId')
				.notNull()
				.references(() => users.id, { onDelete: 'cascade' }),
			type: text('type').$type<AdapterAccount['type']>().notNull(),
			provider: text('provider').notNull(),
			providerAccountId: text('providerAccountId').notNull(),
			refresh_token: text('refresh_token'),
			access_token: text('access_token'),
			expires_at: integer('expires_at'),
			token_type: text('token_type'),
			scope: text('scope'),
			id_token: text('id_token'),
			session_state: text('session_state'),
		},
		(account) => ({
			pk: primaryKey({
				columns: [account.provider, account.providerAccountId],
			}),
		}),
	)

	const sessions = sqliteTable('session', {
		sessionToken: text('sessionToken').notNull().primaryKey(),
		userId: text('userId')
			.notNull()
			.references(() => users.id, { onDelete: 'cascade' }),
		expires: integer('expires', { mode: 'timestamp_ms' }).notNull(),
	})

	const verificationTokens = sqliteTable(
		'verificationToken',
		{
			identifier: text('identifier').notNull(),
			token: text('token').notNull(),
			expires: integer('expires', { mode: 'timestamp_ms' }).notNull(),
		},
		(vt) => ({
			pk: primaryKey({ columns: [vt.identifier, vt.token] }),
		}),
	)

	const contentResource = sqliteTable('contentResource', {
		id: text('id', { length: 255 }).notNull().primaryKey(),
		type: text('type', { length: 255 }).notNull(),
		createdById: text('createdById', { length: 255 }).notNull(),
		fields: text('metadata', { mode: 'json' })
			.$type<Record<string, any>>()
			.default({}),
		createdAt: integer('createdAt', {
			mode: 'timestamp_ms',
		}).default(sql`CURRENT_TIME`),
		updatedAt: integer('updatedAt', {
			mode: 'timestamp_ms',
		}).default(sql`CURRENT_TIME`),
		deletedAt: integer('deletedAt', {
			mode: 'timestamp_ms',
		}),
	})

	const contentResourceResource = sqliteTable(
		'contentResourceResource',
		{
			resourceOfId: text('resourceOfId', { length: 255 }).notNull(),
			resourceId: text('resourceId', { length: 255 }).notNull(),
			position: integer('position').notNull().default(0),
			metadata: text('metadata', { mode: 'json' })
				.$type<Record<string, any>>()
				.default({}),
			createdAt: integer('createdAt', {
				mode: 'timestamp_ms',
			}).default(sql`CURRENT_TIME`),
			updatedAt: integer('updatedAt', {
				mode: 'timestamp_ms',
			}).default(sql`CURRENT_TIME`),
			deletedAt: integer('deletedAt', {
				mode: 'timestamp_ms',
			}),
		},
		(crr) => ({
			pk: primaryKey({ columns: [crr.resourceOfId, crr.resourceId] }),
		}),
	)

	return {
		users,
		accounts,
		sessions,
		verificationTokens,
		contentResource,
		contentResourceResource,
	}
}

export type DefaultSchema = ReturnType<typeof createTables>

export function SQLiteDrizzleAdapter(
	client: InstanceType<typeof BaseSQLiteDatabase>,
	tableFn = defaultSqliteTableFn,
): CourseBuilderAdapter {
	const {
		users,
		accounts,
		sessions,
		verificationTokens,
		contentResource,
		contentResourceResource,
	} = createTables(tableFn)

	return {
		client,
		availableUpgradesForProduct(
			purchases: any,
			productId: string,
		): Promise<
			{
				upgradableTo: { id: string; name: string }
				upgradableFrom: { id: string; name: string }
			}[]
		> {
			return Promise.resolve([])
		},
		clearLessonProgressForUser(options: {
			userId: string
			lessons: { id: string; slug: string }[]
		}): Promise<void> {
			return Promise.resolve(undefined)
		},
		completeLessonProgressForUser(options: {
			userId: string
			lessonId?: string
		}): Promise<ResourceProgress | null> {
			return Promise.resolve(null)
		},
		couponForIdOrCode(options: {
			code?: string
			couponId?: string
		}): Promise<(Coupon & { merchantCoupon: MerchantCoupon }) | null> {
			return Promise.resolve(null)
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
			return Promise.resolve(null)
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
			return Promise.resolve(null)
		},
		getCouponWithBulkPurchases(couponId: string): Promise<
			| (Coupon & {
					bulkCouponPurchases: { bulkCouponId: string }[]
			  })
			| null
		> {
			return Promise.resolve(null)
		},
		getDefaultCoupon(productIds?: string[]): Promise<{
			defaultMerchantCoupon: MerchantCoupon
			defaultCoupon: Coupon
		} | null> {
			return Promise.resolve(null)
		},
		getLessonProgressCountsByDate(): Promise<
			{
				count: number
				completedAt: string
			}[]
		> {
			return Promise.resolve([])
		},
		getLessonProgressForUser(userId: string): Promise<ResourceProgress[]> {
			return Promise.resolve([])
		},
		getLessonProgresses(): Promise<ResourceProgress[]> {
			return Promise.resolve([])
		},
		getMerchantCharge(merchantChargeId: string): Promise<{
			id: string
			identifier: string
			merchantProductId: string
		} | null> {
			return Promise.resolve(null)
		},
		getMerchantCoupon(
			merchantCouponId: string,
		): Promise<MerchantCoupon | null> {
			return Promise.resolve(null)
		},
		getMerchantProduct(
			stripeProductId: string,
		): Promise<MerchantProduct | null> {
			return Promise.resolve(null)
		},
		getPrice(productId: string): Promise<Price | null> {
			return Promise.resolve(null)
		},
		getProduct(productId: string): Promise<Product | null> {
			return Promise.resolve(null)
		},
		getPurchase(purchaseId: string): Promise<Purchase | null> {
			return Promise.resolve(null)
		},
		getPurchaseDetails(
			purchaseId: string,
			userId: string,
		): Promise<{
			purchase?: Purchase
			existingPurchase?: Purchase
			availableUpgrades: UpgradableProduct[]
		}> {
			return Promise.resolve({ availableUpgrades: [] })
		},
		getPurchaseForStripeCharge(
			stripeChargeId: string,
		): Promise<Purchase | null> {
			return Promise.resolve(null)
		},
		getPurchaseUserTransferById(options: { id: string }): Promise<
			| (PurchaseUserTransfer & {
					sourceUser: User
					targetUser: User | null
					purchase: Purchase
			  })
			| null
		> {
			return Promise.resolve(null)
		},
		getPurchaseWithUser(purchaseId: string): Promise<
			| (Purchase & {
					user: User
			  })
			| null
		> {
			return Promise.resolve(null)
		},
		getPurchasesForUser(userId?: string): Promise<
			(Purchase & {
				bulkCoupon: { id: string; maxUses: number; usedCount: number } | null
				product: { id: string; name: string }
			})[]
		> {
			return Promise.resolve([])
		},
		getUserById(userId: string): Promise<User | null> {
			return Promise.resolve(null)
		},
		pricesOfPurchasesTowardOneBundle(options: {
			userId: string | undefined
			bundleId: string
		}): Promise<Price[]> {
			return Promise.resolve([])
		},
		async createPurchase(options): Promise<Purchase> {
			throw new Error('Method not implemented.')
		},
		toggleLessonProgressForUser(options: {
			userId: string
			lessonId?: string
			lessonSlug?: string
		}): Promise<ResourceProgress | null> {
			return Promise.resolve(null)
		},
		transferPurchasesToNewUser(options: {
			merchantCustomerId: string
			userId: string
		}): Promise<unknown> {
			return Promise.resolve(undefined)
		},
		updatePurchaseStatusForCharge(
			chargeId: string,
			status: 'Valid' | 'Refunded' | 'Disputed' | 'Banned' | 'Restricted',
		): Promise<Purchase | undefined> {
			return Promise.resolve(undefined)
		},
		updatePurchaseUserTransferTransferState(options: {
			id: string
			transferState: PurchaseUserTransferState
		}): Promise<PurchaseUserTransfer | null> {
			return Promise.resolve(null)
		},
		async addResourceToResource(options) {
			return null
		},
		async updateContentResourceFields(options) {
			return null
		},
		async getVideoResource(id) {
			//  TODO Implement
			return null
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
			return client
				.insert(users)
				.values({ ...data, id: crypto.randomUUID() })
				.returning()
				.get()
		},
		async getUser(data) {
			const result = await client
				.select()
				.from(users)
				.where(eq(users.id, data))
				.get()
			return result ?? null
		},
		async getUserByEmail(data) {
			const result = await client
				.select()
				.from(users)
				.where(eq(users.email, data))
				.get()
			return result ?? null
		},
		createSession(data) {
			return client.insert(sessions).values(data).returning().get()
		},
		async getSessionAndUser(data) {
			const result = await client
				.select({ session: sessions, user: users })
				.from(sessions)
				.where(eq(sessions.sessionToken, data))
				.innerJoin(users, eq(users.id, sessions.userId))
				.get()
			return result ?? null
		},
		async updateUser(data) {
			if (!data.id) {
				throw new Error('No user id.')
			}

			const result = await client
				.update(users)
				.set(data)
				.where(eq(users.id, data.id))
				.returning()
				.get()
			return result ?? null
		},
		async updateSession(data) {
			const result = await client
				.update(sessions)
				.set(data)
				.where(eq(sessions.sessionToken, data.sessionToken))
				.returning()
				.get()
			return result ?? null
		},
		async linkAccount(rawAccount) {
			return stripUndefined(
				await client.insert(accounts).values(rawAccount).returning().get(),
			)
		},
		async getUserByAccount(account) {
			const results = await client
				.select()
				.from(accounts)
				.leftJoin(users, eq(users.id, accounts.userId))
				.where(
					and(
						eq(accounts.provider, account.provider),
						eq(accounts.providerAccountId, account.providerAccountId),
					),
				)
				.get()

			if (!results) {
				return null
			}
			return Promise.resolve(results).then((results) => results.user)
		},
		async deleteSession(sessionToken) {
			const result = await client
				.delete(sessions)
				.where(eq(sessions.sessionToken, sessionToken))
				.returning()
				.get()
			return result ?? null
		},
		async createVerificationToken(token) {
			const result = await client
				.insert(verificationTokens)
				.values(token)
				.returning()
				.get()
			return result ?? null
		},
		async useVerificationToken(token) {
			try {
				const result = await client
					.delete(verificationTokens)
					.where(
						and(
							eq(verificationTokens.identifier, token.identifier),
							eq(verificationTokens.token, token.token),
						),
					)
					.returning()
					.get()
				return result ?? null
			} catch (err) {
				throw new Error('No verification token found.')
			}
		},
		async deleteUser(id) {
			const result = await client
				.delete(users)
				.where(eq(users.id, id))
				.returning()
				.get()
			return result ?? null
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
				.run()
		},
	}
}
