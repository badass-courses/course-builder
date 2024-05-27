import { sql } from 'drizzle-orm'
import {
	AnyMySqlColumn,
	bigint,
	datetime,
	decimal,
	index,
	int,
	json,
	mysqlEnum,
	mysqlSchema,
	mysqlTable,
	primaryKey,
	text,
	tinyint,
	unique,
	varchar,
} from 'drizzle-orm/mysql-core'

export const account = mysqlTable(
	'Account',
	{
		id: varchar('id', { length: 191 }).notNull(),
		type: varchar('type', { length: 191 }).notNull(),
		provider: varchar('provider', { length: 191 }).notNull(),
		providerAccountId: varchar('providerAccountId', { length: 191 }).notNull(),
		refreshToken: varchar('refresh_token', { length: 191 }),
		accessToken: varchar('access_token', { length: 191 }),
		expiresAt: bigint('expires_at', { mode: 'number' }),
		tokenType: varchar('token_type', { length: 191 }),
		scope: varchar('scope', { length: 191 }),
		idToken: varchar('id_token', { length: 191 }),
		sessionState: varchar('session_state', { length: 191 }),
		oauthTokenSecret: varchar('oauth_token_secret', { length: 191 }),
		oauthToken: varchar('oauth_token', { length: 191 }),
		userId: varchar('userId', { length: 191 }).notNull(),
		refreshTokenExpiresIn: int('refresh_token_expires_in'),
	},
	(table) => {
		return {
			accountId: primaryKey({ columns: [table.id], name: 'Account_id' }),
			accountProviderProviderAccountIdKey: unique(
				'Account_provider_providerAccountId_key',
			).on(table.provider, table.providerAccountId),
		}
	},
)

export const comment = mysqlTable(
	'Comment',
	{
		id: varchar('id', { length: 191 }).notNull(),
		userId: varchar('userId', { length: 191 }).notNull(),
		text: text('text').notNull(),
		context: json('context'),
		updatedAt: datetime('updatedAt', { mode: 'string', fsp: 3 }),
		createdAt: datetime('createdAt', { mode: 'string', fsp: 3 })
			.default(sql`CURRENT_TIMESTAMP(3)`)
			.notNull(),
	},
	(table) => {
		return {
			commentId: primaryKey({ columns: [table.id], name: 'Comment_id' }),
		}
	},
)

export const coupon = mysqlTable(
	'Coupon',
	{
		id: varchar('id', { length: 191 }).notNull(),
		code: varchar('code', { length: 191 }),
		createdAt: datetime('createdAt', { mode: 'string', fsp: 3 })
			.default(sql`CURRENT_TIMESTAMP(3)`)
			.notNull(),
		expires: datetime('expires', { mode: 'string', fsp: 3 }),
		maxUses: int('maxUses').default(-1).notNull(),
		default: tinyint('default').default(0).notNull(),
		merchantCouponId: varchar('merchantCouponId', { length: 191 }),
		status: int('status').default(0).notNull(),
		usedCount: int('usedCount').default(0).notNull(),
		percentageDiscount: decimal('percentageDiscount', {
			precision: 3,
			scale: 2,
		}).notNull(),
		restrictedToProductId: varchar('restrictedToProductId', { length: 191 }),
		bulkPurchaseId: varchar('bulkPurchaseId', { length: 191 }),
	},
	(table) => {
		return {
			couponId: primaryKey({ columns: [table.id], name: 'Coupon_id' }),
			couponCodeKey: unique('Coupon_code_key').on(table.code),
			couponBulkPurchaseIdKey: unique('Coupon_bulkPurchaseId_key').on(
				table.bulkPurchaseId,
			),
		}
	},
)

export const deviceAccessToken = mysqlTable(
	'DeviceAccessToken',
	{
		token: varchar('token', { length: 191 }).notNull(),
		createdAt: datetime('createdAt', { mode: 'string', fsp: 3 }).default(
			sql`CURRENT_TIMESTAMP(3)`,
		),
		userId: varchar('userId', { length: 191 }).notNull(),
	},
	(table) => {
		return {
			deviceAccessTokenToken: primaryKey({
				columns: [table.token],
				name: 'DeviceAccessToken_token',
			}),
		}
	},
)

export const deviceVerification = mysqlTable(
	'DeviceVerification',
	{
		deviceCode: varchar('deviceCode', { length: 191 }).notNull(),
		userCode: varchar('userCode', { length: 191 }).notNull(),
		expires: datetime('expires', { mode: 'string', fsp: 3 }).notNull(),
		createdAt: datetime('createdAt', { mode: 'string', fsp: 3 }).default(
			sql`CURRENT_TIMESTAMP(3)`,
		),
		verifiedAt: datetime('verifiedAt', { mode: 'string', fsp: 3 }),
		verifiedByUserId: varchar('verifiedByUserId', { length: 191 }),
	},
	(table) => {
		return {
			deviceVerificationDeviceCode: primaryKey({
				columns: [table.deviceCode],
				name: 'DeviceVerification_deviceCode',
			}),
			deviceVerificationDeviceCodeKey: unique(
				'DeviceVerification_deviceCode_key',
			).on(table.deviceCode),
		}
	},
)

export const lessonProgress = mysqlTable(
	'LessonProgress',
	{
		id: varchar('id', { length: 191 }).notNull(),
		userId: varchar('userId', { length: 191 }).notNull(),
		lessonId: varchar('lessonId', { length: 191 }),
		sectionId: varchar('sectionId', { length: 191 }),
		moduleId: varchar('moduleId', { length: 191 }),
		lessonSlug: varchar('lessonSlug', { length: 191 }),
		lessonVersion: varchar('lessonVersion', { length: 191 }),
		completedAt: datetime('completedAt', { mode: 'string', fsp: 3 }),
		updatedAt: datetime('updatedAt', { mode: 'string', fsp: 3 }),
		createdAt: datetime('createdAt', { mode: 'string', fsp: 3 })
			.default(sql`CURRENT_TIMESTAMP(3)`)
			.notNull(),
	},
	(table) => {
		return {
			userIdLessonIdIdx: index('LessonProgress_userId_lessonId_idx').on(
				table.userId,
				table.lessonId,
			),
			completedAtIdx: index('LessonProgress_completedAt_idx').on(
				table.completedAt,
			),
			lessonProgressId: primaryKey({
				columns: [table.id],
				name: 'LessonProgress_id',
			}),
		}
	},
)

export const merchantAccount = mysqlTable(
	'MerchantAccount',
	{
		id: varchar('id', { length: 191 }).notNull(),
		status: int('status').default(0).notNull(),
		createdAt: datetime('createdAt', { mode: 'string', fsp: 3 })
			.default(sql`CURRENT_TIMESTAMP(3)`)
			.notNull(),
		label: varchar('label', { length: 191 }),
		identifier: varchar('identifier', { length: 191 }),
	},
	(table) => {
		return {
			merchantAccountId: primaryKey({
				columns: [table.id],
				name: 'MerchantAccount_id',
			}),
		}
	},
)

export const merchantCharge = mysqlTable(
	'MerchantCharge',
	{
		id: varchar('id', { length: 191 }).notNull(),
		status: int('status').default(0).notNull(),
		identifier: varchar('identifier', { length: 191 }).notNull(),
		userId: varchar('userId', { length: 191 }).notNull(),
		merchantAccountId: varchar('merchantAccountId', { length: 191 }).notNull(),
		merchantProductId: varchar('merchantProductId', { length: 191 }).notNull(),
		createdAt: datetime('createdAt', { mode: 'string', fsp: 3 })
			.default(sql`CURRENT_TIMESTAMP(3)`)
			.notNull(),
		merchantCustomerId: varchar('merchantCustomerId', {
			length: 191,
		}).notNull(),
	},
	(table) => {
		return {
			merchantChargeId: primaryKey({
				columns: [table.id],
				name: 'MerchantCharge_id',
			}),
			merchantChargeIdentifierKey: unique('MerchantCharge_identifier_key').on(
				table.identifier,
			),
		}
	},
)

export const merchantCoupon = mysqlTable(
	'MerchantCoupon',
	{
		id: varchar('id', { length: 191 }).notNull(),
		identifier: varchar('identifier', { length: 191 }),
		status: int('status').default(0).notNull(),
		merchantAccountId: varchar('merchantAccountId', { length: 191 }).notNull(),
		percentageDiscount: decimal('percentageDiscount', {
			precision: 3,
			scale: 2,
		}).notNull(),
		type: varchar('type', { length: 191 }),
	},
	(table) => {
		return {
			merchantCouponId: primaryKey({
				columns: [table.id],
				name: 'MerchantCoupon_id',
			}),
			merchantCouponIdentifierKey: unique('MerchantCoupon_identifier_key').on(
				table.identifier,
			),
		}
	},
)

export const merchantCustomer = mysqlTable(
	'MerchantCustomer',
	{
		id: varchar('id', { length: 191 }).notNull(),
		userId: varchar('userId', { length: 191 }).notNull(),
		merchantAccountId: varchar('merchantAccountId', { length: 191 }).notNull(),
		identifier: varchar('identifier', { length: 191 }).notNull(),
		createdAt: datetime('createdAt', { mode: 'string', fsp: 3 })
			.default(sql`CURRENT_TIMESTAMP(3)`)
			.notNull(),
		status: int('status').default(0),
	},
	(table) => {
		return {
			merchantCustomerId: primaryKey({
				columns: [table.id],
				name: 'MerchantCustomer_id',
			}),
			merchantCustomerIdentifierKey: unique(
				'MerchantCustomer_identifier_key',
			).on(table.identifier),
		}
	},
)

export const merchantPrice = mysqlTable(
	'MerchantPrice',
	{
		id: varchar('id', { length: 191 }).notNull(),
		merchantAccountId: varchar('merchantAccountId', { length: 191 }).notNull(),
		merchantProductId: varchar('merchantProductId', { length: 191 }).notNull(),
		status: int('status').default(0),
		identifier: varchar('identifier', { length: 191 }),
		createdAt: datetime('createdAt', { mode: 'string', fsp: 3 })
			.default(sql`CURRENT_TIMESTAMP(3)`)
			.notNull(),
		priceId: varchar('priceId', { length: 191 }),
	},
	(table) => {
		return {
			merchantPriceId: primaryKey({
				columns: [table.id],
				name: 'MerchantPrice_id',
			}),
			merchantPriceIdentifierKey: unique('MerchantPrice_identifier_key').on(
				table.identifier,
			),
		}
	},
)

export const merchantProduct = mysqlTable(
	'MerchantProduct',
	{
		id: varchar('id', { length: 191 }).notNull(),
		merchantAccountId: varchar('merchantAccountId', { length: 191 }).notNull(),
		productId: varchar('productId', { length: 191 }).notNull(),
		status: int('status').default(0).notNull(),
		identifier: varchar('identifier', { length: 191 }),
		createdAt: datetime('createdAt', { mode: 'string', fsp: 3 })
			.default(sql`CURRENT_TIMESTAMP(3)`)
			.notNull(),
	},
	(table) => {
		return {
			merchantProductId: primaryKey({
				columns: [table.id],
				name: 'MerchantProduct_id',
			}),
			merchantProductIdentifierKey: unique('MerchantProduct_identifier_key').on(
				table.identifier,
			),
		}
	},
)

export const merchantSession = mysqlTable(
	'MerchantSession',
	{
		id: varchar('id', { length: 191 }).notNull(),
		identifier: varchar('identifier', { length: 191 }).notNull(),
		merchantAccountId: varchar('merchantAccountId', { length: 191 }).notNull(),
	},
	(table) => {
		return {
			merchantSessionId: primaryKey({
				columns: [table.id],
				name: 'MerchantSession_id',
			}),
		}
	},
)

export const price = mysqlTable(
	'Price',
	{
		id: varchar('id', { length: 191 }).notNull(),
		productId: varchar('productId', { length: 191 }),
		nickname: varchar('nickname', { length: 191 }),
		status: int('status').default(0).notNull(),
		unitAmount: decimal('unitAmount', { precision: 10, scale: 2 }).notNull(),
		createdAt: datetime('createdAt', { mode: 'string', fsp: 3 })
			.default(sql`CURRENT_TIMESTAMP(3)`)
			.notNull(),
	},
	(table) => {
		return {
			priceId: primaryKey({ columns: [table.id], name: 'Price_id' }),
		}
	},
)

export const product = mysqlTable(
	'Product',
	{
		id: varchar('id', { length: 191 }).notNull(),
		name: varchar('name', { length: 191 }).notNull(),
		key: varchar('key', { length: 191 }),
		createdAt: datetime('createdAt', { mode: 'string', fsp: 3 })
			.default(sql`CURRENT_TIMESTAMP(3)`)
			.notNull(),
		status: int('status').default(0).notNull(),
		quantityAvailable: int('quantityAvailable').default(-1).notNull(),
		productType: varchar('productType', { length: 191 }),
	},
	(table) => {
		return {
			productId: primaryKey({ columns: [table.id], name: 'Product_id' }),
		}
	},
)

export const purchase = mysqlTable(
	'Purchase',
	{
		id: varchar('id', { length: 191 }).notNull(),
		userId: varchar('userId', { length: 191 }),
		createdAt: datetime('createdAt', { mode: 'string', fsp: 3 })
			.default(sql`CURRENT_TIMESTAMP(3)`)
			.notNull(),
		totalAmount: decimal('totalAmount', { precision: 65, scale: 30 }).notNull(),
		ipAddress: varchar('ip_address', { length: 191 }),
		city: varchar('city', { length: 191 }),
		state: varchar('state', { length: 191 }),
		country: varchar('country', { length: 191 }),
		couponId: varchar('couponId', { length: 191 }),
		bulkCouponId: varchar('bulkCouponId', { length: 191 }),
		redeemedBulkCouponId: varchar('redeemedBulkCouponId', { length: 191 }),
		productId: varchar('productId', { length: 191 }).notNull(),
		merchantChargeId: varchar('merchantChargeId', { length: 191 }),
		upgradedFromId: varchar('upgradedFromId', { length: 191 }),
		status: varchar('status', { length: 191 }).default('Valid').notNull(),
		merchantSessionId: varchar('merchantSessionId', { length: 191 }),
	},
	(table) => {
		return {
			userIdIdx: index('Purchase_userId_idx').on(table.userId),
			purchaseId: primaryKey({ columns: [table.id], name: 'Purchase_id' }),
			purchaseUpgradedFromIdKey: unique('Purchase_upgradedFromId_key').on(
				table.upgradedFromId,
			),
		}
	},
)

export const purchaseUserTransfer = mysqlTable(
	'PurchaseUserTransfer',
	{
		id: varchar('id', { length: 191 }).notNull(),
		transferState: mysqlEnum('transferState', [
			'AVAILABLE',
			'INITIATED',
			'VERIFIED',
			'CANCELED',
			'EXPIRED',
			'CONFIRMED',
			'COMPLETED',
		])
			.default('AVAILABLE')
			.notNull(),
		purchaseId: varchar('purchaseId', { length: 191 }).notNull(),
		sourceUserId: varchar('sourceUserId', { length: 191 }).notNull(),
		targetUserId: varchar('targetUserId', { length: 191 }),
		createdAt: datetime('createdAt', { mode: 'string', fsp: 3 })
			.default(sql`CURRENT_TIMESTAMP(3)`)
			.notNull(),
		expiresAt: datetime('expiresAt', { mode: 'string', fsp: 3 }),
		canceledAt: datetime('canceledAt', { mode: 'string', fsp: 3 }),
		confirmedAt: datetime('confirmedAt', { mode: 'string', fsp: 3 }),
		completedAt: datetime('completedAt', { mode: 'string', fsp: 3 }),
	},
	(table) => {
		return {
			purchaseUserTransferId: primaryKey({
				columns: [table.id],
				name: 'PurchaseUserTransfer_id',
			}),
		}
	},
)

export const session = mysqlTable(
	'Session',
	{
		id: varchar('id', { length: 191 }).notNull(),
		sessionToken: varchar('sessionToken', { length: 191 }).notNull(),
		userId: varchar('userId', { length: 191 }),
		expires: datetime('expires', { mode: 'string', fsp: 3 }),
	},
	(table) => {
		return {
			sessionId: primaryKey({ columns: [table.id], name: 'Session_id' }),
		}
	},
)

export const upgradableProducts = mysqlTable(
	'UpgradableProducts',
	{
		upgradableToId: varchar('upgradableToId', { length: 191 }).notNull(),
		upgradableFromId: varchar('upgradableFromId', { length: 191 }).notNull(),
	},
	(table) => {
		return {
			upgradableProductsUpgradableToIdUpgradableFromId: primaryKey({
				columns: [table.upgradableToId, table.upgradableFromId],
				name: 'UpgradableProducts_upgradableToId_upgradableFromId',
			}),
		}
	},
)

export const user = mysqlTable(
	'User',
	{
		id: varchar('id', { length: 191 }).notNull(),
		name: varchar('name', { length: 191 }),
		email: varchar('email', { length: 191 }).notNull(),
		emailVerified: datetime('emailVerified', { mode: 'string', fsp: 3 }),
		image: varchar('image', { length: 191 }),
		roles: varchar('roles', { length: 191 }).default('User').notNull(),
		fields: json('fields'),
	},
	(table) => {
		return {
			userId: primaryKey({ columns: [table.id], name: 'User_id' }),
			userEmailKey: unique('User_email_key').on(table.email),
		}
	},
)

export const verificationToken = mysqlTable(
	'VerificationToken',
	{
		token: varchar('token', { length: 191 }).notNull(),
		identifier: varchar('identifier', { length: 191 }).notNull(),
		expires: datetime('expires', { mode: 'string', fsp: 3 }),
		createdAt: datetime('createdAt', { mode: 'string', fsp: 3 }).default(
			sql`CURRENT_TIMESTAMP(3)`,
		),
	},
	(table) => {
		return {
			verificationTokenToken: primaryKey({
				columns: [table.token],
				name: 'VerificationToken_token',
			}),
			verificationTokenIdentifierTokenKey: unique(
				'VerificationToken_identifier_token_key',
			).on(table.identifier, table.token),
		}
	},
)
