import { relations, sql } from 'drizzle-orm'
import {
	index,
	json,
	MySqlTableFn,
	timestamp,
	uniqueIndex,
	varchar,
} from 'drizzle-orm/mysql-core'

import { getUsersSchema } from './users.js'

export function getProfilesSchema(mysqlTable: MySqlTableFn) {
	return mysqlTable(
		'Profile',
		{
			id: varchar('id', { length: 255 }).notNull().primaryKey(),
			userId: varchar('userId', { length: 255 }).notNull(),
			type: varchar('type', { length: 255 }).notNull(),
			fields: json('fields').$type<Record<string, any>>().default({}),
			createdAt: timestamp('createdAt', {
				mode: 'date',
				fsp: 3,
			}).default(sql`CURRENT_TIMESTAMP(3)`),
			updatedAt: timestamp('updatedAt', {
				mode: 'date',
				fsp: 3,
			}).default(sql`CURRENT_TIMESTAMP(3)`),
		},
		(profile) => ({
			userIdIdx: index('userId_idx').on(profile.userId),
			uniqueUserType: uniqueIndex('unique_user_type_idx').on(
				profile.userId,
				profile.type,
			),
		}),
	)
}

export function getProfilesRelationsSchema(mysqlTable: MySqlTableFn) {
	const profiles = getProfilesSchema(mysqlTable)
	const users = getUsersSchema(mysqlTable)
	return relations(profiles, ({ one }) => ({
		user: one(users, {
			fields: [profiles.userId],
			references: [users.id],
			relationName: 'profiles',
		}),
	}))
}
