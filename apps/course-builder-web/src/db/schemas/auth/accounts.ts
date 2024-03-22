import { mysqlTable } from '@/db/mysql-table'
import { users } from '@/db/schemas/auth/users'
import { relations } from 'drizzle-orm'

import { getAccountsSchema } from '@coursebuilder/adapter-drizzle/mysql'

export const { accounts } = getAccountsSchema(mysqlTable)

export const accountsRelations = relations(accounts, ({ one }) => ({
	user: one(users, { fields: [accounts.userId], references: [users.id] }),
}))
