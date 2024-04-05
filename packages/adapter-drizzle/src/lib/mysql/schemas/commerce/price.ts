import { sql } from 'drizzle-orm'
import {
	decimal,
	int,
	json,
	MySqlTableFn,
	primaryKey,
	timestamp,
	varchar,
} from 'drizzle-orm/mysql-core'

export function getPriceSchema(mysqlTable: MySqlTableFn) {
	return mysqlTable(
		'prices',
		{
			id: varchar('id', { length: 191 }).notNull(),
			productId: varchar('productId', { length: 191 }),
			nickname: varchar('nickname', { length: 191 }),
			status: int('status').default(0).notNull(),
			unitAmount: decimal('unitAmount', { precision: 10, scale: 2 }).notNull(),
			createdAt: timestamp('createdAt', { mode: 'date', fsp: 3 })
				.default(sql`CURRENT_TIMESTAMP(3)`)
				.notNull(),
			metadata: json('fields').$type<Record<string, any>>().default({}),
		},
		(table) => {
			return {
				priceId: primaryKey({ columns: [table.id], name: 'Price_id' }),
			}
		},
	)
}
