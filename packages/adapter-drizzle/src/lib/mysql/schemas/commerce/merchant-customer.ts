import { sql } from 'drizzle-orm'
import {
	datetime,
	int,
	MySqlTableFn,
	primaryKey,
	unique,
	varchar,
} from 'drizzle-orm/mysql-core'

export function getMerchantCustomerSchema(mysqlTable: MySqlTableFn) {
	return mysqlTable(
		'merchantCustomers',
		{
			id: varchar('id', { length: 191 }).notNull(),
			userId: varchar('userId', { length: 191 }).notNull(),
			merchantAccountId: varchar('merchantAccountId', {
				length: 191,
			}).notNull(),
			identifier: varchar('identifier', { length: 191 }).notNull(),
			createdAt: datetime('createdAt', { mode: 'string', fsp: 3 })
				.default(sql`CURRENT_TIMESTAMP(3)`)
				.notNull(),
			status: int('status').default(0),
		},
		(table) => {
			return {
				merchantCustomerId: primaryKey({
					columns: [table.id],
					name: 'MerchantCustomer_id',
				}),
				merchantCustomerIdentifierKey: unique(
					'MerchantCustomer_identifier_key',
				).on(table.identifier),
			}
		},
	)
}
