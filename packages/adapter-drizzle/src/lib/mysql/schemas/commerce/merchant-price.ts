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

export function getMerchantPriceSchema(mysqlTable: MySqlTableFn) {
	return mysqlTable(
		'MerchantPrice',
		{
			id: varchar('id', { length: 191 }).notNull(),
			organizationId: varchar('organizationId', { length: 191 }),
			merchantAccountId: varchar('merchantAccountId', {
				length: 191,
			}).notNull(),
			merchantProductId: varchar('merchantProductId', {
				length: 191,
			}).notNull(),
			status: int('status').default(0),
			identifier: varchar('identifier', { length: 191 }),
			createdAt: timestamp('createdAt', { mode: 'date', fsp: 3 })
				.default(sql`CURRENT_TIMESTAMP(3)`)
				.notNull(),
			priceId: varchar('priceId', { length: 191 }),
		},
		(table) => {
			return {
				merchantPriceId: primaryKey({
					columns: [table.id],
					name: 'MerchantPrice_id',
				}),
				merchantPriceIdentifierKey: unique('MerchantPrice_identifier_key').on(
					table.identifier,
				),
				organizationIdIdx: index('organizationId_idx').on(table.organizationId),
			}
		},
	)
}
