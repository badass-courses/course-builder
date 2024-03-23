import { sql } from 'drizzle-orm'
import {
	datetime,
	int,
	MySqlTableFn,
	primaryKey,
	unique,
	varchar,
} from 'drizzle-orm/mysql-core'

export function getMerchantPriceSchema(mysqlTable: MySqlTableFn) {
	return mysqlTable(
		'merchantPrices',
		{
			id: varchar('id', { length: 191 }).notNull(),
			merchantAccountId: varchar('merchantAccountId', {
				length: 191,
			}).notNull(),
			merchantProductId: varchar('merchantProductId', {
				length: 191,
			}).notNull(),
			status: int('status').default(0),
			identifier: varchar('identifier', { length: 191 }),
			createdAt: datetime('createdAt', { mode: 'string', fsp: 3 })
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
			}
		},
	)
}
