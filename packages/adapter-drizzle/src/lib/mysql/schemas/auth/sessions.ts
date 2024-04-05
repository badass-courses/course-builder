import { relations } from 'drizzle-orm'
import { index, MySqlTableFn, timestamp, varchar } from 'drizzle-orm/mysql-core'

import { getUsersSchema } from './users.js'

export function getSessionsSchema(mysqlTable: MySqlTableFn) {
	return mysqlTable(
		'session',
		{
			sessionToken: varchar('sessionToken', { length: 255 })
				.notNull()
				.primaryKey(),
			userId: varchar('userId', { length: 255 }).notNull(),
			expires: timestamp('expires', { mode: 'date' }).notNull(),
		},
		(session) => ({
			userIdIdx: index('userId_idx').on(session.userId),
		}),
	)
}

export function getSessionRelationsSchema(mysqlTable: MySqlTableFn) {
	const sessions = getSessionsSchema(mysqlTable)
	const users = getUsersSchema(mysqlTable)
	return relations(sessions, ({ one }) => ({
		user: one(users, {
			fields: [sessions.userId],
			references: [users.id],
			relationName: 'user',
		}),
	}))
}
