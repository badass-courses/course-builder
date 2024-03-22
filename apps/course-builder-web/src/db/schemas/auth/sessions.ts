import { mysqlTable } from '@/db/mysql-table'
import { users } from '@/db/schemas/auth/users'
import { relations } from 'drizzle-orm'

import { getSessionsSchema } from '@coursebuilder/adapter-drizzle/mysql'

export const { sessions } = getSessionsSchema(mysqlTable)

export const sessionsRelations = relations(sessions, ({ one }) => ({
	user: one(users, { fields: [sessions.userId], references: [users.id] }),
}))
