import { mysqlTable } from '@/db/mysql-table'
import { sql } from 'drizzle-orm'
import {
	datetime,
	decimal,
	int,
	json,
	primaryKey,
	varchar,
} from 'drizzle-orm/mysql-core'

export const price = mysqlTable(
	'prices',
	{
		id: varchar('id', { length: 191 }).notNull(),
		productId: varchar('productId', { length: 191 }),
		nickname: varchar('nickname', { length: 191 }),
		status: int('status').default(0).notNull(),
		unitAmount: decimal('unitAmount', { precision: 10, scale: 2 }).notNull(),
		createdAt: datetime('createdAt', { mode: 'string', fsp: 3 })
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
