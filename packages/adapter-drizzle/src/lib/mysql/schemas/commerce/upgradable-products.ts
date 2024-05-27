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

import { getProductSchema } from './product.js'

export function getUpgradableProductsSchema(mysqlTable: MySqlTableFn) {
	return mysqlTable(
		'UpgradableProduct',
		{
			upgradableToId: varchar('upgradableToId', { length: 255 }).notNull(),
			upgradableFromId: varchar('upgradableFrom', { length: 255 }).notNull(),
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
			pk: primaryKey({ columns: [crr.upgradableToId, crr.upgradableFromId] }),
			upgradableToIdIdx: index('upgradableFromId_idx').on(crr.upgradableToId),
			upgradableFromIdIdx: index('upgradableToId_idx').on(crr.upgradableFromId),
		}),
	)
}

export function getUpgradableProductsRelationsSchema(mysqlTable: MySqlTableFn) {
	const product = getProductSchema(mysqlTable)
	const upgradableProduct = getUpgradableProductsSchema(mysqlTable)
	return relations(upgradableProduct, ({ one }) => ({
		upgradableTo: one(product, {
			fields: [upgradableProduct.upgradableToId],
			references: [product.id],
			relationName: 'upgradableTo',
		}),
		upgradableFrom: one(product, {
			fields: [upgradableProduct.upgradableFromId],
			references: [product.id],
			relationName: 'upgradableFrom',
		}),
	}))
}
