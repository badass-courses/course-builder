import { index, MySqlTableFn, timestamp, varchar } from 'drizzle-orm/mysql-core'

export const getSessionsSchema = (mysqlTable: MySqlTableFn) => {
	const sessions = mysqlTable(
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

	return { sessions }
}
