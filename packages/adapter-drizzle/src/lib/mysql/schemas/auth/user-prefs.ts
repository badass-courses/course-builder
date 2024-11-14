import { relations, sql } from 'drizzle-orm'
import {
	index,
	json,
	MySqlTableFn,
	primaryKey,
	text,
	timestamp,
	varchar,
} from 'drizzle-orm/mysql-core'

import { getUsersSchema } from '../auth/users.js'

export function getUserPrefsSchema(mysqlTable: MySqlTableFn) {
	return mysqlTable(
		'UserPrefs',
		{
			id: varchar('id', { length: 191 }).notNull(),
			organizationId: varchar('organizationId', { length: 191 }),
			type: varchar('type', { length: 191 }).default('Global').notNull(),
			userId: varchar('userId', { length: 255 }).notNull(),
			fields: json('fields').$type<Record<string, any>>().default({}),
			createdAt: timestamp('createdAt', {
				mode: 'date',
				fsp: 3,
			}).default(sql`CURRENT_TIMESTAMP(3)`),
			updatedAt: timestamp('updatedAt', {
				mode: 'date',
				fsp: 3,
			}).default(sql`CURRENT_TIMESTAMP(3)`),
			deletedAt: timestamp('deletedAt', {
				mode: 'date',
				fsp: 3,
			}),
		},
		(crr) => ({
			pk: primaryKey({ columns: [crr.id] }),
			crrUserIdIdKey: index('crr_userIdId_idx').on(crr.userId),
			organizationIdIdx: index('organizationId_idx').on(crr.organizationId),
		}),
	)
}

export function getUserPrefsRelationsSchema(mysqlTable: MySqlTableFn) {
	const userPrefs = getUserPrefsSchema(mysqlTable)
	const user = getUsersSchema(mysqlTable)
	return relations(userPrefs, ({ one }) => ({
		user: one(user, {
			fields: [userPrefs.userId],
			references: [user.id],
			relationName: 'user',
		}),
	}))
}
