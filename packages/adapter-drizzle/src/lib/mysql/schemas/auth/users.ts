import { relations, sql } from 'drizzle-orm'
import {
	index,
	mysqlEnum,
	MySqlTableFn,
	timestamp,
	varchar,
} from 'drizzle-orm/mysql-core'

import { getCommunicationPreferencesSchema } from '../communication/communication-preferences'
import { getContentContributionsSchema } from '../content/content-contributions'
import { getContentResourceSchema } from '../content/content-resource'
import { getAccountsSchema } from './accounts'
import { getUserPermissionsSchema } from './user-permissions'
import { getUserRolesSchema } from './user-roles'

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
	return relations(users, ({ many }) => ({
		accounts: many(accounts),
		communicationPreferences: many(communicationPreferences),
		userRoles: many(userRoles),
		userPermissions: many(userPermissions),
		contributions: many(contentContributions),
		createdContent: many(contentResource),
	}))
}
