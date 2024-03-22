import { mysqlTable } from '@/db/mysql-table'
import { sql } from 'drizzle-orm'
import {
	datetime,
	int,
	json,
	primaryKey,
	varchar,
} from 'drizzle-orm/mysql-core'

export const product = mysqlTable(
	'products',
	{
		id: varchar('id', { length: 191 }).notNull(),
		name: varchar('name', { length: 191 }).notNull(),
		key: varchar('key', { length: 191 }),
		metadata: json('fields').$type<Record<string, any>>().default({}),
		createdAt: datetime('createdAt', { mode: 'string', fsp: 3 })
			.default(sql`CURRENT_TIMESTAMP(3)`)
			.notNull(),
		status: int('status').default(0).notNull(),
		quantityAvailable: int('quantityAvailable').default(-1).notNull(),
	},
	(table) => {
		return {
			productId: primaryKey({ columns: [table.id], name: 'Product_id' }),
		}
	},
)
