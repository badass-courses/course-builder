import { relations, sql } from 'drizzle-orm'
import {
	double,
	index,
	json,
	MySqlTableFn,
	primaryKey,
	timestamp,
	varchar,
} from 'drizzle-orm/mysql-core'

import { getProductSchema } from '../commerce/product.js'
import { getContentResourceSchema } from './content-resource.js'

export function getContentResourceProductSchema(mysqlTable: MySqlTableFn) {
	return mysqlTable(
		'contentResourceProduct',
		{
			productId: varchar('productId', { length: 255 }).notNull(),
			resourceId: varchar('resourceId', { length: 255 }).notNull(),
			position: double('position').notNull().default(0),
			metadata: json('metadata').$type<Record<string, any>>().default({}),
			createdAt: timestamp('createdAt', {
				mode: 'date',
				fsp: 3,
			}).default(sql`CURRENT_TIMESTAMP(3)`),
			updatedAt: timestamp('updatedAt', {
				mode: 'date',
				fsp: 3,
			}).default(sql`CURRENT_TIMESTAMP(3)`),
			deletedAt: timestamp('deletedAt', {
				mode: 'date',
				fsp: 3,
			}),
		},
		(crr) => ({
			pk: primaryKey({ columns: [crr.productId, crr.resourceId] }),
			contentResourceIdIdx: index('contentResourceId_idx').on(crr.productId),
			resourceIdIdx: index('resourceId_idx').on(crr.resourceId),
		}),
	)
}

export function getContentResourceProductRelationsSchema(
	mysqlTable: MySqlTableFn,
) {
	const contentResource = getContentResourceSchema(mysqlTable)
	const contentResourceProduct = getContentResourceProductSchema(mysqlTable)
	const product = getProductSchema(mysqlTable)
	return relations(contentResourceProduct, ({ one }) => ({
		product: one(product, {
			fields: [contentResourceProduct.productId],
			references: [product.id],
			relationName: 'product',
		}),
		resource: one(contentResource, {
			fields: [contentResourceProduct.resourceId],
			references: [contentResource.id],
			relationName: 'resource',
		}),
	}))
}
