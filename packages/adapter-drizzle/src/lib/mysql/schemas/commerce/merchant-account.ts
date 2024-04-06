import { sql } from 'drizzle-orm'
import {
	int,
	MySqlTableFn,
	primaryKey,
	timestamp,
	varchar,
} from 'drizzle-orm/mysql-core'

export function getMerchantAccountSchema(mysqlTable: MySqlTableFn) {
	return mysqlTable(
		'merchantAccounts',
		{
			id: varchar('id', { length: 191 }).notNull(),
			status: int('status').default(0).notNull(),
			createdAt: timestamp('createdAt', { mode: 'date', fsp: 3 })
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
}
