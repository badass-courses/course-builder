import { relations, sql } from 'drizzle-orm'
import {
	index,
	mysqlEnum,
	MySqlTableFn,
	timestamp,
	varchar,
} from 'drizzle-orm/mysql-core'

import { getPurchaseSchema } from '../commerce/purchase.js'
import { getCommunicationPreferencesSchema } from '../communication/communication-preferences.js'
import { getContentContributionsSchema } from '../content/content-contributions.js'
import { getContentResourceSchema } from '../content/content-resource.js'
import { getAccountsSchema } from './accounts.js'
import { getUserPermissionsSchema } from './user-permissions.js'
import { getUserRolesSchema } from './user-roles.js'

export function getUsersSchema(mysqlTable: MySqlTableFn) {
	return mysqlTable(
		'user',
		{
			id: varchar('id', { length: 255 }).notNull().primaryKey(),
			name: varchar('name', { length: 255 }),
			role: mysqlEnum('role', ['user', 'admin']).default('user'),
			email: varchar('email', { length: 255 }).notNull().unique(),
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
	const accounts = getAccountsSchema(mysqlTable)
	const communicationPreferences = getCommunicationPreferencesSchema(mysqlTable)
	const userRoles = getUserRolesSchema(mysqlTable)
	const userPermissions = getUserPermissionsSchema(mysqlTable)
	const contentContributions = getContentContributionsSchema(mysqlTable)
	const contentResource = getContentResourceSchema(mysqlTable)
	const purchases = getPurchaseSchema(mysqlTable)
	return relations(users, ({ many }) => ({
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
	}))
}
