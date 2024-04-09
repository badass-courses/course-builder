import { relations, sql } from 'drizzle-orm'
import {
	int,
	json,
	MySqlTableFn,
	primaryKey,
	timestamp,
	varchar,
} from 'drizzle-orm/mysql-core'

import { getContentResourceProductSchema } from '../content/content-resource-product.js'
import { getMerchantProductSchema } from './merchant-product.js'
import { getPriceSchema } from './price.js'

export function getProductSchema(mysqlTable: MySqlTableFn) {
	return mysqlTable(
		'products',
		{
			id: varchar('id', { length: 191 }).notNull(),
			name: varchar('name', { length: 191 }).notNull(),
			key: varchar('key', { length: 191 }),
			fields: json('fields').$type<Record<string, any>>().default({}),
			createdAt: timestamp('createdAt', { mode: 'date', fsp: 3 })
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
}

export function getProductRelationsSchema(mysqlTable: MySqlTableFn) {
	const product = getProductSchema(mysqlTable)
	const price = getPriceSchema(mysqlTable)
	const merchantProduct = getMerchantProductSchema(mysqlTable)
	const contentResourceProduct = getContentResourceProductSchema(mysqlTable)
	return relations(product, ({ one, many }) => ({
		price: one(price, {
			fields: [product.id],
			references: [price.productId],
			relationName: 'price',
		}),
		resources: many(contentResourceProduct, { relationName: 'product' }),
		merchantProduct: one(merchantProduct, {
			fields: [product.id],
			references: [merchantProduct.productId],
			relationName: 'merchantProduct',
		}),
	}))
}
