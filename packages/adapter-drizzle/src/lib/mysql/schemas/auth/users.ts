import { relations, sql } from 'drizzle-orm'
import {
	index,
	json,
	mysqlEnum,
	MySqlTableFn,
	timestamp,
	varchar,
} from 'drizzle-orm/mysql-core'

import { getPurchaseSchema } from '../commerce/purchase.js'
import { getCommentsSchema } from '../communication/comment.js'
import { getCommunicationPreferencesSchema } from '../communication/communication-preferences.js'
import { getContentContributionsSchema } from '../content/content-contributions.js'
import { getContentResourceSchema } from '../content/content-resource.js'
import { getOrganizationMembershipsSchema } from '../org/organization-memberships.js'
import { getAccountsSchema } from './accounts.js'
import { getProfilesSchema } from './profiles.js'
import { getUserPermissionsSchema } from './user-permissions.js'
import { getUserPrefsSchema } from './user-prefs.js'
import { getUserRolesSchema } from './user-roles.js'

export function getUsersSchema(mysqlTable: MySqlTableFn) {
	return mysqlTable(
		'User',
		{
			id: varchar('id', { length: 255 }).notNull().primaryKey(),
			name: varchar('name', { length: 255 }),
			role: varchar('role', { length: 191 }).notNull().default('user'),
			email: varchar('email', { length: 255 }).notNull().unique(),
			fields: json('fields').$type<Record<string, any>>().default({}),
			emailVerified: timestamp('emailVerified', {
				mode: 'date',
				fsp: 3,
			}),
			image: varchar('image', { length: 255 }),
			createdAt: timestamp('createdAt', {
				mode: 'date',
				fsp: 3,
			}).default(sql`CURRENT_TIMESTAMP(3)`),
		},
		(user) => ({
			emailIdx: index('email_idx').on(user.email),
			roleIdx: index('role_idx').on(user.role),
			createdAtIdx: index('created_at_idx').on(user.createdAt),
		}),
	)
}

export function getUsersRelationsSchema(mysqlTable: MySqlTableFn) {
	const users = getUsersSchema(mysqlTable)
	const profiles = getProfilesSchema(mysqlTable)
	const accounts = getAccountsSchema(mysqlTable)
	const communicationPreferences = getCommunicationPreferencesSchema(mysqlTable)
	const userRoles = getUserRolesSchema(mysqlTable)
	const userPermissions = getUserPermissionsSchema(mysqlTable)
	const contentContributions = getContentContributionsSchema(mysqlTable)
	const contentResource = getContentResourceSchema(mysqlTable)
	const purchases = getPurchaseSchema(mysqlTable)
	const comments = getCommentsSchema(mysqlTable)
	const userPrefs = getUserPrefsSchema(mysqlTable)
	const organizationMemberships = getOrganizationMembershipsSchema(mysqlTable)
	return relations(users, ({ many, one }) => ({
		profile: one(profiles, {
			fields: [users.id],
			references: [profiles.userId],
			relationName: 'profile',
		}),
		accounts: many(accounts, {
			relationName: 'user',
		}),
		purchases: many(purchases, {
			relationName: 'user',
		}),
		communicationPreferences: many(communicationPreferences, {
			relationName: 'user',
		}),
		roles: many(userRoles, {
			relationName: 'user',
		}),
		userPermissions: many(userPermissions, {
			relationName: 'user',
		}),
		contributions: many(contentContributions, {
			relationName: 'user',
		}),
		createdContent: many(contentResource, {
			relationName: 'user',
		}),
		comments: many(comments, {
			relationName: 'user',
		}),
		prefs: many(userPrefs, {
			relationName: 'user',
		}),
		organizationMemberships: many(organizationMemberships, {
			relationName: 'user',
		}),
	}))
}
