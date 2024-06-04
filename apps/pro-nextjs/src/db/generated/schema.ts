import { sql } from 'drizzle-orm'
import {
	AnyMySqlColumn,
	datetime,
	decimal,
	double,
	index,
	int,
	json,
	mysqlEnum,
	mysqlSchema,
	mysqlTable,
	primaryKey,
	text,
	timestamp,
	tinyint,
	unique,
	varchar,
} from 'drizzle-orm/mysql-core'

export const Account = mysqlTable('Account', {
	id: varchar('id', { length: 191 }).notNull(),
	type: varchar('type', { length: 255 }).notNull(),
	provider: varchar('provider', { length: 255 }).notNull(),
	providerAccountId: varchar('providerAccountId', { length: 255 }).notNull(),
	refresh_token: text('refresh_token'),
	access_token: text('access_token'),
	expires_at: int('expires_at'),
	token_type: varchar('token_type', { length: 255 }),
	scope: varchar('scope', { length: 255 }),
	id_token: text('id_token'),
	session_state: varchar('session_state', { length: 255 }),
	oauth_token_secret: text('oauth_token_secret'),
	oauth_token: text('oauth_token'),
	userId: varchar('userId', { length: 255 }).notNull(),
	refresh_token_expires_in: int('refresh_token_expires_in'),
})

export const Comment = mysqlTable('Comment', {
	id: varchar('id', { length: 191 }).notNull(),
	userId: varchar('userId', { length: 255 }).notNull(),
	text: text('text').notNull(),
	context: json('context').default({}),
	updatedAt: timestamp('updatedAt', { fsp: 3, mode: 'string' }).default(
		sql`(CURRENT_TIMESTAMP(3))`,
	),
	createdAt: timestamp('createdAt', { fsp: 3, mode: 'string' }).default(
		sql`(CURRENT_TIMESTAMP(3))`,
	),
})

export const CommunicationChannel = mysqlTable(
	'CommunicationChannel',
	{
		id: varchar('id', { length: 255 }).notNull(),
		name: varchar('name', { length: 255 }).notNull(),
		description: text('description'),
		active: tinyint('active').default(1).notNull(),
		createdAt: timestamp('createdAt', { fsp: 3, mode: 'string' }).default(
			sql`(now())`,
		),
		updatedAt: timestamp('updatedAt', { fsp: 3, mode: 'string' }).default(
			sql`(now())`,
		),
		deletedAt: timestamp('deletedAt', { fsp: 3, mode: 'string' }),
	},
	(table) => {
		return {
			CommunicationChannel_id: primaryKey({
				columns: [table.id],
				name: 'CommunicationChannel_id',
			}),
		}
	},
)

export const CommunicationPreference = mysqlTable(
	'CommunicationPreference',
	{
		id: varchar('id', { length: 255 }).notNull(),
		userId: varchar('userId', { length: 255 }).notNull(),
		channelId: varchar('channelId', { length: 255 }).notNull(),
		preferenceLevel: mysqlEnum('preferenceLevel', ['low', 'medium', 'high'])
			.default('medium')
			.notNull(),
		preferenceTypeId: varchar('preferenceTypeId', { length: 255 }).notNull(),
		active: tinyint('active').default(1).notNull(),
		createdAt: timestamp('createdAt', { fsp: 3, mode: 'string' }).default(
			sql`(now())`,
		),
		optInAt: timestamp('optInAt', { fsp: 3, mode: 'string' }),
		optOutAt: timestamp('optOutAt', { fsp: 3, mode: 'string' }),
		updatedAt: timestamp('updatedAt', { fsp: 3, mode: 'string' }).default(
			sql`(now())`,
		),
		deletedAt: timestamp('deletedAt', { fsp: 3, mode: 'string' }),
	},
	(table) => {
		return {
			CommunicationPreference_id: primaryKey({
				columns: [table.id],
				name: 'CommunicationPreference_id',
			}),
		}
	},
)

export const CommunicationPreferenceType = mysqlTable(
	'CommunicationPreferenceType',
	{
		id: varchar('id', { length: 255 }).notNull(),
		name: varchar('name', { length: 255 }).notNull(),
		description: text('description'),
		active: tinyint('active').default(1).notNull(),
		createdAt: timestamp('createdAt', { fsp: 3, mode: 'string' }).default(
			sql`(now())`,
		),
		updatedAt: timestamp('updatedAt', { fsp: 3, mode: 'string' }),
		deletedAt: timestamp('deletedAt', { fsp: 3, mode: 'string' }),
	},
	(table) => {
		return {
			CommunicationPreferenceType_id: primaryKey({
				columns: [table.id],
				name: 'CommunicationPreferenceType_id',
			}),
		}
	},
)

export const ContentContribution = mysqlTable(
	'ContentContribution',
	{
		id: varchar('id', { length: 255 }).notNull(),
		userId: varchar('userId', { length: 255 }).notNull(),
		contentId: varchar('contentId', { length: 255 }).notNull(),
		contributionTypeId: varchar('contributionTypeId', {
			length: 255,
		}).notNull(),
		active: tinyint('active').default(1).notNull(),
		createdAt: timestamp('createdAt', { fsp: 3, mode: 'string' }).default(
			sql`(now())`,
		),
		updatedAt: timestamp('updatedAt', { fsp: 3, mode: 'string' }).default(
			sql`(now())`,
		),
		deletedAt: timestamp('deletedAt', { fsp: 3, mode: 'string' }),
	},
	(table) => {
		return {
			ContentContribution_id: primaryKey({
				columns: [table.id],
				name: 'ContentContribution_id',
			}),
		}
	},
)

export const ContentResource = mysqlTable(
	'ContentResource',
	{
		id: varchar('id', { length: 255 }).notNull(),
		type: varchar('type', { length: 255 }).notNull(),
		createdById: varchar('createdById', { length: 255 }).notNull(),
		fields: json('fields').default({}),
		createdAt: timestamp('createdAt', { fsp: 3, mode: 'string' }).default(
			sql`(CURRENT_TIMESTAMP(3))`,
		),
		updatedAt: timestamp('updatedAt', { fsp: 3, mode: 'string' }).default(
			sql`(CURRENT_TIMESTAMP(3))`,
		),
		deletedAt: timestamp('deletedAt', { fsp: 3, mode: 'string' }),
	},
	(table) => {
		return {
			ContentResource_id: primaryKey({
				columns: [table.id],
				name: 'ContentResource_id',
			}),
		}
	},
)

export const ContentResourceProduct = mysqlTable('ContentResourceProduct', {
	productId: varchar('productId', { length: 255 }).notNull(),
	resourceId: varchar('resourceId', { length: 255 }).notNull(),
	position: double('position').notNull(),
	metadata: json('metadata').default({}),
	createdAt: timestamp('createdAt', { fsp: 3, mode: 'string' }).default(
		sql`(CURRENT_TIMESTAMP(3))`,
	),
	updatedAt: timestamp('updatedAt', { fsp: 3, mode: 'string' }).default(
		sql`(CURRENT_TIMESTAMP(3))`,
	),
	deletedAt: timestamp('deletedAt', { fsp: 3, mode: 'string' }),
})

export const ContentResourceResource = mysqlTable('ContentResourceResource', {
	resourceOfId: varchar('resourceOfId', { length: 255 }).notNull(),
	resourceId: varchar('resourceId', { length: 255 }).notNull(),
	position: double('position').notNull(),
	metadata: json('metadata').default({}),
	createdAt: timestamp('createdAt', { fsp: 3, mode: 'string' }).default(
		sql`(CURRENT_TIMESTAMP(3))`,
	),
	updatedAt: timestamp('updatedAt', { fsp: 3, mode: 'string' }).default(
		sql`(CURRENT_TIMESTAMP(3))`,
	),
	deletedAt: timestamp('deletedAt', { fsp: 3, mode: 'string' }),
})

export const ContributionType = mysqlTable(
	'ContributionType',
	{
		id: varchar('id', { length: 255 }).notNull(),
		slug: varchar('slug', { length: 255 }).notNull(),
		name: varchar('name', { length: 255 }).notNull(),
		description: text('description'),
		active: tinyint('active').default(1).notNull(),
		createdAt: timestamp('createdAt', { fsp: 3, mode: 'string' }).default(
			sql`(now())`,
		),
		updatedAt: timestamp('updatedAt', { fsp: 3, mode: 'string' }).default(
			sql`(now())`,
		),
		deletedAt: timestamp('deletedAt', { fsp: 3, mode: 'string' }),
	},
	(table) => {
		return {
			ContributionType_id: primaryKey({
				columns: [table.id],
				name: 'ContributionType_id',
			}),
			ContributionType_slug_unique: unique('ContributionType_slug_unique').on(
				table.slug,
			),
		}
	},
)

export const Coupon = mysqlTable(
	'Coupon',
	{
		id: varchar('id', { length: 191 }).notNull(),
		code: varchar('code', { length: 191 }),
		createdAt: timestamp('createdAt', { fsp: 3, mode: 'string' })
			.default(sql`(CURRENT_TIMESTAMP(3))`)
			.notNull(),
		expires: timestamp('expires', { fsp: 3, mode: 'string' }),
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
			Coupon_id: primaryKey({ columns: [table.id], name: 'Coupon_id' }),
			Coupon_code_key: unique('Coupon_code_key').on(table.code),
			Coupon_bulkPurchaseId_key: unique('Coupon_bulkPurchaseId_key').on(
				table.bulkPurchaseId,
			),
		}
	},
)

export const LessonProgress = mysqlTable(
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
			.default(sql`(CURRENT_TIMESTAMP(3))`)
			.notNull(),
	},
	(table) => {
		return {
			userId_lessonId_idx: index('LessonProgress_userId_lessonId_idx').on(
				table.userId,
				table.lessonId,
			),
			completedAt_idx: index('LessonProgress_completedAt_idx').on(
				table.completedAt,
			),
			LessonProgress_id: primaryKey({
				columns: [table.id],
				name: 'LessonProgress_id',
			}),
		}
	},
)

export const MerchantAccount = mysqlTable(
	'MerchantAccount',
	{
		id: varchar('id', { length: 191 }).notNull(),
		status: int('status').default(0).notNull(),
		createdAt: timestamp('createdAt', { fsp: 3, mode: 'string' })
			.default(sql`(CURRENT_TIMESTAMP(3))`)
			.notNull(),
		label: varchar('label', { length: 191 }),
		identifier: varchar('identifier', { length: 191 }),
	},
	(table) => {
		return {
			MerchantAccount_id: primaryKey({
				columns: [table.id],
				name: 'MerchantAccount_id',
			}),
		}
	},
)

export const MerchantCharge = mysqlTable(
	'MerchantCharge',
	{
		id: varchar('id', { length: 191 }).notNull(),
		status: int('status').default(0).notNull(),
		identifier: varchar('identifier', { length: 191 }).notNull(),
		userId: varchar('userId', { length: 191 }).notNull(),
		merchantAccountId: varchar('merchantAccountId', { length: 191 }).notNull(),
		merchantProductId: varchar('merchantProductId', { length: 191 }).notNull(),
		createdAt: timestamp('createdAt', { fsp: 3, mode: 'string' })
			.default(sql`(CURRENT_TIMESTAMP(3))`)
			.notNull(),
		merchantCustomerId: varchar('merchantCustomerId', {
			length: 191,
		}).notNull(),
	},
	(table) => {
		return {
			MerchantCharge_id: primaryKey({
				columns: [table.id],
				name: 'MerchantCharge_id',
			}),
			MerchantCharge_identifier_key: unique('MerchantCharge_identifier_key').on(
				table.identifier,
			),
		}
	},
)

export const MerchantCoupon = mysqlTable(
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
			MerchantCoupon_id: primaryKey({
				columns: [table.id],
				name: 'MerchantCoupon_id',
			}),
			MerchantCoupon_identifier_key: unique('MerchantCoupon_identifier_key').on(
				table.identifier,
			),
		}
	},
)

export const MerchantCustomer = mysqlTable(
	'MerchantCustomer',
	{
		id: varchar('id', { length: 191 }).notNull(),
		userId: varchar('userId', { length: 191 }).notNull(),
		merchantAccountId: varchar('merchantAccountId', { length: 191 }).notNull(),
		identifier: varchar('identifier', { length: 191 }).notNull(),
		createdAt: timestamp('createdAt', { fsp: 3, mode: 'string' })
			.default(sql`(CURRENT_TIMESTAMP(3))`)
			.notNull(),
		status: int('status').default(0),
	},
	(table) => {
		return {
			MerchantCustomer_id: primaryKey({
				columns: [table.id],
				name: 'MerchantCustomer_id',
			}),
			MerchantCustomer_identifier_key: unique(
				'MerchantCustomer_identifier_key',
			).on(table.identifier),
		}
	},
)

export const MerchantPrice = mysqlTable(
	'MerchantPrice',
	{
		id: varchar('id', { length: 191 }).notNull(),
		merchantAccountId: varchar('merchantAccountId', { length: 191 }).notNull(),
		merchantProductId: varchar('merchantProductId', { length: 191 }).notNull(),
		status: int('status').default(0),
		identifier: varchar('identifier', { length: 191 }),
		createdAt: timestamp('createdAt', { fsp: 3, mode: 'string' })
			.default(sql`(CURRENT_TIMESTAMP(3))`)
			.notNull(),
		priceId: varchar('priceId', { length: 191 }),
	},
	(table) => {
		return {
			MerchantPrice_id: primaryKey({
				columns: [table.id],
				name: 'MerchantPrice_id',
			}),
			MerchantPrice_identifier_key: unique('MerchantPrice_identifier_key').on(
				table.identifier,
			),
		}
	},
)

export const MerchantProduct = mysqlTable(
	'MerchantProduct',
	{
		id: varchar('id', { length: 191 }).notNull(),
		merchantAccountId: varchar('merchantAccountId', { length: 191 }).notNull(),
		productId: varchar('productId', { length: 191 }).notNull(),
		status: int('status').default(0).notNull(),
		identifier: varchar('identifier', { length: 191 }),
		createdAt: timestamp('createdAt', { fsp: 3, mode: 'string' })
			.default(sql`(CURRENT_TIMESTAMP(3))`)
			.notNull(),
	},
	(table) => {
		return {
			MerchantProduct_id: primaryKey({
				columns: [table.id],
				name: 'MerchantProduct_id',
			}),
			MerchantProduct_identifier_key: unique(
				'MerchantProduct_identifier_key',
			).on(table.identifier),
		}
	},
)

export const MerchantSession = mysqlTable(
	'MerchantSession',
	{
		id: varchar('id', { length: 191 }).notNull(),
		identifier: varchar('identifier', { length: 191 }).notNull(),
		merchantAccountId: varchar('merchantAccountId', { length: 191 }).notNull(),
	},
	(table) => {
		return {
			MerchantSession_id: primaryKey({
				columns: [table.id],
				name: 'MerchantSession_id',
			}),
		}
	},
)

export const Permission = mysqlTable(
	'Permission',
	{
		id: varchar('id', { length: 255 }).notNull(),
		name: varchar('name', { length: 255 }).notNull(),
		description: text('description'),
		active: tinyint('active').default(1).notNull(),
		createdAt: timestamp('createdAt', { fsp: 3, mode: 'string' }).default(
			sql`(now())`,
		),
		updatedAt: timestamp('updatedAt', { fsp: 3, mode: 'string' }).default(
			sql`(now())`,
		),
		deletedAt: timestamp('deletedAt', { fsp: 3, mode: 'string' }),
	},
	(table) => {
		return {
			Permission_id: primaryKey({ columns: [table.id], name: 'Permission_id' }),
			Permission_name_unique: unique('Permission_name_unique').on(table.name),
		}
	},
)

export const Price = mysqlTable(
	'Price',
	{
		id: varchar('id', { length: 191 }).notNull(),
		productId: varchar('productId', { length: 191 }),
		nickname: varchar('nickname', { length: 191 }),
		status: int('status').default(0).notNull(),
		unitAmount: decimal('unitAmount', { precision: 10, scale: 2 }).notNull(),
		createdAt: timestamp('createdAt', { fsp: 3, mode: 'string' })
			.default(sql`(CURRENT_TIMESTAMP(3))`)
			.notNull(),
	},
	(table) => {
		return {
			Price_id: primaryKey({ columns: [table.id], name: 'Price_id' }),
		}
	},
)

export const Product = mysqlTable(
	'Product',
	{
		id: varchar('id', { length: 191 }).notNull(),
		name: varchar('name', { length: 191 }).notNull(),
		key: varchar('key', { length: 191 }),
		createdAt: timestamp('createdAt', { fsp: 3, mode: 'string' })
			.default(sql`(CURRENT_TIMESTAMP(3))`)
			.notNull(),
		status: int('status').default(0).notNull(),
		quantityAvailable: int('quantityAvailable').default(-1).notNull(),
		type: varchar('type', { length: 191 }),
	},
	(table) => {
		return {
			Product_id: primaryKey({ columns: [table.id], name: 'Product_id' }),
		}
	},
)

export const Purchase = mysqlTable(
	'Purchase',
	{
		id: varchar('id', { length: 191 }).notNull(),
		userId: varchar('userId', { length: 191 }),
		createdAt: timestamp('createdAt', { fsp: 3, mode: 'string' })
			.default(sql`(CURRENT_TIMESTAMP(3))`)
			.notNull(),
		totalAmount: decimal('totalAmount', { precision: 65, scale: 30 }).notNull(),
		ip_address: varchar('ip_address', { length: 191 }),
		city: varchar('city', { length: 191 }),
		state: varchar('state', { length: 191 }),
		country: varchar('country', { length: 191 }),
		couponId: varchar('couponId', { length: 191 }),
		bulkCouponId: varchar('bulkCouponId', { length: 191 }),
		redeemedBulkCouponId: varchar('redeemedBulkCouponId', { length: 191 }),
		productId: varchar('productId', { length: 191 }).notNull(),
		merchantChargeId: varchar('merchantChargeId', { length: 191 }),
		merchantSessionId: varchar('merchantSessionId', { length: 191 }),
		upgradedFromId: varchar('upgradedFromId', { length: 191 }),
		status: varchar('status', { length: 191 }).default('Valid').notNull(),
	},
	(table) => {
		return {
			Purchase_id: primaryKey({ columns: [table.id], name: 'Purchase_id' }),
			Purchase_upgradedFromId_key: unique('Purchase_upgradedFromId_key').on(
				table.upgradedFromId,
			),
		}
	},
)

export const PurchaseUserTransfer = mysqlTable(
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
		createdAt: timestamp('createdAt', { fsp: 3, mode: 'string' })
			.default(sql`(CURRENT_TIMESTAMP(3))`)
			.notNull(),
		expiresAt: timestamp('expiresAt', { fsp: 3, mode: 'string' }),
		canceledAt: timestamp('canceledAt', { fsp: 3, mode: 'string' }),
		confirmedAt: timestamp('confirmedAt', { fsp: 3, mode: 'string' }),
		completedAt: timestamp('completedAt', { fsp: 3, mode: 'string' }),
	},
	(table) => {
		return {
			PurchaseUserTransfer_id: primaryKey({
				columns: [table.id],
				name: 'PurchaseUserTransfer_id',
			}),
		}
	},
)

export const ResourceProgress = mysqlTable('ResourceProgress', {
	userId: varchar('userId', { length: 191 }).notNull(),
	contentResourceId: varchar('contentResourceId', { length: 191 }).notNull(),
	fields: json('fields').default({}),
	completedAt: datetime('completedAt', { mode: 'string', fsp: 3 }),
	updatedAt: datetime('updatedAt', { mode: 'string', fsp: 3 }),
	createdAt: datetime('createdAt', { mode: 'string', fsp: 3 })
		.default(sql`(CURRENT_TIMESTAMP(3))`)
		.notNull(),
})

export const Role = mysqlTable(
	'Role',
	{
		id: varchar('id', { length: 255 }).notNull(),
		name: varchar('name', { length: 255 }).notNull(),
		description: text('description'),
		active: tinyint('active').default(1).notNull(),
		createdAt: timestamp('createdAt', { fsp: 3, mode: 'string' }).default(
			sql`(now())`,
		),
		updatedAt: timestamp('updatedAt', { fsp: 3, mode: 'string' }).default(
			sql`(now())`,
		),
		deletedAt: timestamp('deletedAt', { fsp: 3, mode: 'string' }),
	},
	(table) => {
		return {
			Role_id: primaryKey({ columns: [table.id], name: 'Role_id' }),
			Role_name_unique: unique('Role_name_unique').on(table.name),
		}
	},
)

export const RolePermission = mysqlTable('RolePermission', {
	roleId: varchar('roleId', { length: 255 }).notNull(),
	permissionId: varchar('permissionId', { length: 255 }).notNull(),
	active: tinyint('active').default(1).notNull(),
	createdAt: timestamp('createdAt', { fsp: 3, mode: 'string' }).default(
		sql`(now())`,
	),
	updatedAt: timestamp('updatedAt', { fsp: 3, mode: 'string' }).default(
		sql`(now())`,
	),
	deletedAt: timestamp('deletedAt', { fsp: 3, mode: 'string' }),
})

export const Session = mysqlTable('Session', {
	id: varchar('id', { length: 191 }).notNull(),
	sessionToken: varchar('sessionToken', { length: 255 }).notNull(),
	userId: varchar('userId', { length: 255 }).notNull(),
	expires: timestamp('expires', { mode: 'string' }).notNull(),
})

export const UpgradableProducts = mysqlTable('UpgradableProducts', {
	upgradableToId: varchar('upgradableToId', { length: 255 }).notNull(),
	upgradableFrom: varchar('upgradableFrom', { length: 255 }).notNull(),
})

export const User = mysqlTable(
	'User',
	{
		id: varchar('id', { length: 255 }).notNull(),
		name: varchar('name', { length: 255 }),
		email: varchar('email', { length: 255 }).notNull(),
		emailVerified: timestamp('emailVerified', { fsp: 3, mode: 'string' }),
		image: varchar('image', { length: 255 }),
		role: varchar('role', { length: 191 }).default('User').notNull(),
		fields: json('fields'),
	},
	(table) => {
		return {
			User_id: primaryKey({ columns: [table.id], name: 'User_id' }),
		}
	},
)

export const UserPermission = mysqlTable('UserPermission', {
	userId: varchar('userId', { length: 255 }).notNull(),
	permissionId: varchar('permissionId', { length: 255 }).notNull(),
	active: tinyint('active').default(1).notNull(),
	createdAt: timestamp('createdAt', { fsp: 3, mode: 'string' }).default(
		sql`(now())`,
	),
	updatedAt: timestamp('updatedAt', { fsp: 3, mode: 'string' }).default(
		sql`(now())`,
	),
	deletedAt: timestamp('deletedAt', { fsp: 3, mode: 'string' }),
})

export const UserPrefs = mysqlTable('UserPrefs', {
	id: varchar('id', { length: 191 }).notNull(),
	userId: varchar('userId', { length: 191 }).notNull(),
	type: varchar('type', { length: 191 }).default('Global').notNull(),
	fields: json('fields'),
	createdAt: datetime('createdAt', { mode: 'string', fsp: 3 })
		.default(sql`(CURRENT_TIMESTAMP(3))`)
		.notNull(),
	updatedAt: datetime('updatedAt', { mode: 'string', fsp: 3 }),
})

export const UserRole = mysqlTable('UserRole', {
	userId: varchar('userId', { length: 255 }).notNull(),
	roleId: varchar('roleId', { length: 255 }).notNull(),
	active: tinyint('active').default(1).notNull(),
	createdAt: timestamp('createdAt', { fsp: 3, mode: 'string' }).default(
		sql`(now())`,
	),
	updatedAt: timestamp('updatedAt', { fsp: 3, mode: 'string' }).default(
		sql`(now())`,
	),
	deletedAt: timestamp('deletedAt', { fsp: 3, mode: 'string' }),
})

export const VerificationToken = mysqlTable('VerificationToken', {
	token: varchar('token', { length: 191 }).notNull(),
	identifier: varchar('identifier', { length: 191 }).notNull(),
	expires: datetime('expires', { mode: 'string', fsp: 3 }),
	createdAt: datetime('createdAt', { mode: 'string', fsp: 3 }).default(
		sql`(CURRENT_TIMESTAMP(3))`,
	),
})
