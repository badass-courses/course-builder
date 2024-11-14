import { sql } from 'drizzle-orm'
import {
	index,
	int,
	MySqlTableFn,
	primaryKey,
	timestamp,
	varchar,
} from 'drizzle-orm/mysql-core'

export function getMerchantAccountSchema(mysqlTable: MySqlTableFn) {
	return mysqlTable(
		'MerchantAccount',
		{
			id: varchar('id', { length: 191 }).notNull(),
			organizationId: varchar('organizationId', { length: 191 }),
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
				organizationIdIdx: index('organizationId_idx').on(table.organizationId),
			}
		},
	)
}
