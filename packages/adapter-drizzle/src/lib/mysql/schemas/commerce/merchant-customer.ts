import { sql } from 'drizzle-orm'
import {
	index,
	int,
	MySqlTableFn,
	primaryKey,
	timestamp,
	unique,
	varchar,
} from 'drizzle-orm/mysql-core'

export function getMerchantCustomerSchema(mysqlTable: MySqlTableFn) {
	return mysqlTable(
		'MerchantCustomer',
		{
			id: varchar('id', { length: 191 }).notNull(),
			organizationId: varchar('organizationId', { length: 191 }),
			userId: varchar('userId', { length: 191 }).notNull(),
			merchantAccountId: varchar('merchantAccountId', {
				length: 191,
			}).notNull(),
			identifier: varchar('identifier', { length: 191 }).notNull(),
			createdAt: timestamp('createdAt', { mode: 'date', fsp: 3 })
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
				userIdIdx: index('idx_MerchantCustomer_on_userId').on(table.userId),
				organizationIdIdx: index('organizationId_idx').on(table.organizationId),
			}
		},
	)
}
