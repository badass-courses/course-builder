import type {
	AdapterAccount,
	AdapterSession,
	AdapterUser,
} from '@auth/core/adapters'
import { and, asc, eq } from 'drizzle-orm'
import {
	pgTable as defaultPgTableFn,
	integer,
	json,
	PgDatabase,
	pgEnum,
	PgTableFn,
	primaryKey,
	text,
	timestamp,
	varchar,
} from 'drizzle-orm/pg-core'

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

export function createTables(pgTable: PgTableFn) {
	const users = pgTable('user', {
		id: text('id').notNull().primaryKey(),
		name: text('name'),
		email: text('email').notNull(),
		emailVerified: timestamp('emailVerified', { mode: 'date' }),
		role: pgEnum('role', ['user', 'admin'])('role').default('user'),
		image: text('image'),
	})

	const accounts = pgTable(
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

	const sessions = pgTable('session', {
		sessionToken: text('sessionToken').notNull().primaryKey(),
		userId: text('userId')
			.notNull()
			.references(() => users.id, { onDelete: 'cascade' }),
		expires: timestamp('expires', { mode: 'date' }).notNull(),
	})

	const verificationTokens = pgTable(
		'verificationToken',
		{
			identifier: text('identifier').notNull(),
			token: text('token').notNull(),
			expires: timestamp('expires', { mode: 'date' }).notNull(),
		},
		(vt) => ({
			pk: primaryKey({ columns: [vt.identifier, vt.token] }),
		}),
	)

	const contentResource = pgTable('contentResource', {
		id: varchar('id', { length: 255 }).notNull().primaryKey(),
		type: varchar('type', { length: 255 }).notNull(),
		createdById: varchar('createdById', { length: 255 }).notNull(),
		fields: json('fields').$type<Record<string, any>>().default({}),
		createdAt: timestamp('createdAt', {
			mode: 'date',
			precision: 6,
			withTimezone: true,
		}).defaultNow(),
		updatedAt: timestamp('updatedAt', {
			mode: 'date',
			precision: 6,
			withTimezone: true,
		}).defaultNow(),
		deletedAt: timestamp('deletedAt', {
			mode: 'date',
			precision: 6,
			withTimezone: true,
		}),
	})

	const contentResourceResource = pgTable(
		'contentResourceResource',
		{
			resourceOfId: varchar('resourceOfId', { length: 255 }).notNull(),
			resourceId: varchar('resourceId', { length: 255 }).notNull(),
			position: integer('position').notNull().default(0),
			metadata: json('fields').$type<Record<string, any>>().default({}),
			createdAt: timestamp('createdAt', {
				mode: 'date',
				precision: 6,
				withTimezone: true,
			}).defaultNow(),
			updatedAt: timestamp('updatedAt', {
				mode: 'date',
				precision: 6,
				withTimezone: true,
			}).defaultNow(),
			deletedAt: timestamp('deletedAt', {
				mode: 'date',
				precision: 6,
				withTimezone: true,
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

export function pgDrizzleAdapter(
	client: InstanceType<typeof PgDatabase>,
	tableFn = defaultPgTableFn,
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
		async createPurchase(options): Promise<Purchase> {
			throw new Error('Method not implemented.')
		},
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
			return await client
				.insert(users)
				.values({ ...data, id: crypto.randomUUID() })
				.returning()
				.then((res) => (res[0] as AdapterUser) ?? null)
		},
		async getUser(data) {
			return await client
				.select()
				.from(users)
				.where(eq(users.id, data))
				.then((res) => res[0] ?? null)
		},
		async getUserByEmail(data) {
			return await client
				.select()
				.from(users)
				.where(eq(users.email, data))
				.then((res) => res[0] ?? null)
		},
		async createSession(data) {
			return await client
				.insert(sessions)
				.values(data)
				.returning()
				.then((res) => res[0] as AdapterSession)
		},
		async getSessionAndUser(data) {
			return await client
				.select({
					session: sessions,
					user: users,
				})
				.from(sessions)
				.where(eq(sessions.sessionToken, data))
				.innerJoin(users, eq(users.id, sessions.userId))
				.then((res) => res[0] ?? null)
		},
		async updateUser(data) {
			if (!data.id) {
				throw new Error('No user id.')
			}

			return await client
				.update(users)
				.set(data)
				.where(eq(users.id, data.id))
				.returning()
				.then((res) => res[0] as AdapterUser)
		},
		async updateSession(data) {
			return await client
				.update(sessions)
				.set(data)
				.where(eq(sessions.sessionToken, data.sessionToken))
				.returning()
				.then((res) => res[0])
		},
		async linkAccount(rawAccount) {
			await client
				.insert(accounts)
				.values(rawAccount)
				.returning()
				.then((res) => res[0])
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

			return dbAccount?.user ?? null
		},
		async deleteSession(sessionToken) {
			const session = await client
				.delete(sessions)
				.where(eq(sessions.sessionToken, sessionToken))
				.returning()
				.then((res) => res[0] ?? null)

			return session
		},
		async createVerificationToken(token) {
			return await client
				.insert(verificationTokens)
				.values(token)
				.returning()
				.then((res) => res[0])
		},
		async useVerificationToken(token) {
			try {
				return await client
					.delete(verificationTokens)
					.where(
						and(
							eq(verificationTokens.identifier, token.identifier),
							eq(verificationTokens.token, token.token),
						),
					)
					.returning()
					.then((res) => res[0] ?? null)
			} catch (err) {
				throw new Error('No verification token found.')
			}
		},
		async deleteUser(id) {
			await client
				.delete(users)
				.where(eq(users.id, id))
				.returning()
				.then((res) => res[0] ?? null)
		},
		async unlinkAccount(account) {
			const { type, provider, providerAccountId, userId } = await client
				.delete(accounts)
				.where(
					and(
						eq(accounts.providerAccountId, account.providerAccountId),
						eq(accounts.provider, account.provider),
					),
				)
				.returning()
				.then((res) => (res[0] as AdapterAccount) ?? null)

			return { provider, type, providerAccountId, userId }
		},
	}
}
