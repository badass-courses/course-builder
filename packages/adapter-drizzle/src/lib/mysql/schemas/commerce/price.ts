import { relations, sql } from 'drizzle-orm'
import {
	decimal,
	int,
	json,
	MySqlTableFn,
	primaryKey,
	timestamp,
	varchar,
} from 'drizzle-orm/mysql-core'

import { getMerchantPriceSchema } from './merchant-price.js'
import { getProductSchema } from './product.js'

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
			fields: json('fields').$type<Record<string, any>>().default({}),
		},
		(table) => {
			return {
				priceId: primaryKey({ columns: [table.id], name: 'Price_id' }),
			}
		},
	)
}

export function getProductRelationsSchema(mysqlTable: MySqlTableFn) {
	const product = getProductSchema(mysqlTable)
	const price = getPriceSchema(mysqlTable)
	const merchantPrice = getMerchantPriceSchema(mysqlTable)
	return relations(price, ({ one, many }) => ({
		product: one(product, {
			fields: [price.productId],
			references: [product.id],
			relationName: 'user',
		}),
		merchantPrice: one(merchantPrice, {
			fields: [price.id],
			references: [merchantPrice.priceId],
			relationName: 'merchantPrice',
		}),
	}))
}
