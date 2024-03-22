import { mysqlTable } from '@/db/mysql-table'
import { sql } from 'drizzle-orm'
import { datetime, int, primaryKey, varchar } from 'drizzle-orm/mysql-core'

export const merchantAccount = mysqlTable(
	'merchantAccounts',
	{
		id: varchar('id', { length: 191 }).notNull(),
		status: int('status').default(0).notNull(),
		createdAt: datetime('createdAt', { mode: 'string', fsp: 3 })
			.default(sql`CURRENT_TIMESTAMP(3)`)
			.notNull(),
		label: varchar('label', { length: 191 }),
		identifier: varchar('identifier', { length: 191 }),
	},
	(table) => {
		return {
			merchantAccountId: primaryKey({
				columns: [table.id],
				name: 'MerchantAccount_id',
			}),
		}
	},
)
