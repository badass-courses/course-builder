import { mysqlTable } from '@/db/mysql-table'
import { users } from '@/db/schemas/users'
import { relations } from 'drizzle-orm'
import { index, timestamp, varchar } from 'drizzle-orm/mysql-core'

export const sessions = mysqlTable(
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

export const sessionsRelations = relations(sessions, ({ one }) => ({
	user: one(users, { fields: [sessions.userId], references: [users.id] }),
}))
