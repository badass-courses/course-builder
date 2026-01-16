import { mysqlTable } from '@/db/mysql-table'
import { relations } from 'drizzle-orm'
import { int, text, timestamp, varchar } from 'drizzle-orm/mysql-core'

import { getCourseBuilderSchema } from '@coursebuilder/adapter-drizzle/mysql'
import { guid } from '@coursebuilder/utils-core/guid'

export const {
	accounts,
	accountsRelations,
	profiles,
	profilesRelations,
	permissions,
	permissionsRelations,
	rolePermissions,
	rolePermissionsRelations,
	roles,
	rolesRelations,
	sessions,
	sessionsRelations,
	userPermissions,
	userPermissionsRelations,
	userRoles,
	userRolesRelations,
	users,
	usersRelations,
	verificationTokens,
	coupon,
	couponRelations,
	merchantAccount,
	merchantCharge,
	merchantChargeRelations,
	merchantEvents,
	merchantEventsRelations,
	merchantCoupon,
	merchantCustomer,
	merchantPrice,
	merchantProduct,
	merchantSession,
	prices,
	products,
	productRelations,
	purchases,
	purchaseRelations,
	purchaseUserTransfer,
	purchaseUserTransferRelations,
	communicationChannel,
	communicationPreferenceTypes,
	communicationPreferences,
	communicationPreferencesRelations,
	contentContributions,
	contentContributionRelations,
	contentResource,
	contentResourceRelations,
	contentResourceTag,
	contentResourceTagRelations,
	tag,
	tagRelations,
	tagTag,
	tagTagRelations,
	contentResourceVersion,
	contentResourceVersionRelations,
	contentResourceResource,
	contentResourceResourceRelations,
	contributionTypes,
	contributionTypesRelations,
	resourceProgress,
	questionResponse,
	questionResponseRelations,
	contentResourceProduct,
	contentResourceProductRelations,
	upgradableProducts,
	upgradableProductsRelations,
	comments,
	commentsRelations,
	userPrefs,
	userPrefsRelations,
	organization,
	organizationRelations,
	organizationMemberships,
	organizationMembershipRelations,
	organizationMembershipRoles,
	organizationMembershipRolesRelations,
	merchantSubscription,
	merchantSubscriptionRelations,
	subscription,
	subscriptionRelations,
	deviceVerifications,
	deviceVerificationRelations,
	deviceAccessToken,
	deviceAccessTokenRelations,
	entitlements,
	entitlementsRelations,
	entitlementTypes,
} = getCourseBuilderSchema(mysqlTable)

/**
 * Shortlink table for URL shortening
 */
export const shortlink = mysqlTable('Shortlink', {
	id: varchar('id', { length: 255 })
		.notNull()
		.primaryKey()
		.$defaultFn(() => guid()),
	slug: varchar('slug', { length: 50 }).notNull().unique(),
	url: text('url').notNull(),
	description: varchar('description', { length: 255 }),
	clicks: int('clicks').default(0).notNull(),
	createdById: varchar('createdById', { length: 255 }).references(
		() => users.id,
	),
	createdAt: timestamp('createdAt').defaultNow().notNull(),
	updatedAt: timestamp('updatedAt').defaultNow().notNull(),
})

export const shortlinkRelations = relations(shortlink, ({ one, many }) => ({
	createdBy: one(users, {
		fields: [shortlink.createdById],
		references: [users.id],
	}),
	clicks: many(shortlinkClick),
	attributions: many(shortlinkAttribution),
}))

/**
 * Shortlink click events for analytics
 */
export const shortlinkClick = mysqlTable('ShortlinkClick', {
	id: varchar('id', { length: 255 })
		.notNull()
		.primaryKey()
		.$defaultFn(() => guid()),
	shortlinkId: varchar('shortlinkId', { length: 255 })
		.notNull()
		.references(() => shortlink.id, { onDelete: 'cascade' }),
	timestamp: timestamp('timestamp').defaultNow().notNull(),
	referrer: varchar('referrer', { length: 500 }),
	userAgent: varchar('userAgent', { length: 500 }),
	country: varchar('country', { length: 2 }),
	device: varchar('device', { length: 50 }),
})

export const shortlinkClickRelations = relations(shortlinkClick, ({ one }) => ({
	shortlink: one(shortlink, {
		fields: [shortlinkClick.shortlinkId],
		references: [shortlink.id],
	}),
}))

/**
 * Shortlink attribution tracking for signups/purchases
 */
export const shortlinkAttribution = mysqlTable('ShortlinkAttribution', {
	id: varchar('id', { length: 255 })
		.notNull()
		.primaryKey()
		.$defaultFn(() => guid()),
	shortlinkId: varchar('shortlinkId', { length: 255 })
		.notNull()
		.references(() => shortlink.id, { onDelete: 'cascade' }),
	userId: varchar('userId', { length: 255 }).references(() => users.id, {
		onDelete: 'set null',
	}),
	email: varchar('email', { length: 255 }),
	type: varchar('type', { length: 50 }).notNull(),
	metadata: text('metadata'),
	createdAt: timestamp('createdAt').defaultNow().notNull(),
})

export const shortlinkAttributionRelations = relations(
	shortlinkAttribution,
	({ one }) => ({
		shortlink: one(shortlink, {
			fields: [shortlinkAttribution.shortlinkId],
			references: [shortlink.id],
		}),
		user: one(users, {
			fields: [shortlinkAttribution.userId],
			references: [users.id],
		}),
	}),
)
