import { relations, sql } from 'drizzle-orm'
import {
	index,
	int,
	MySqlTableFn,
	primaryKey,
	timestamp,
	unique,
	varchar,
} from 'drizzle-orm/mysql-core'

import { getMerchantAccountSchema } from './merchant-account.js'
import { getMerchantCustomerSchema } from './merchant-customer.js'
import { getMerchantProductSchema } from './merchant-product.js'

export function getMerchantChargeSchema(mysqlTable: MySqlTableFn) {
	return mysqlTable(
		'MerchantCharge',
		{
			id: varchar('id', { length: 191 }).notNull(),
			organizationId: varchar('organizationId', { length: 191 }),
			status: int('status').default(0).notNull(),
			identifier: varchar('identifier', { length: 191 }).notNull(),
			userId: varchar('userId', { length: 191 }).notNull(),
			merchantAccountId: varchar('merchantAccountId', {
				length: 191,
			}).notNull(),
			merchantProductId: varchar('merchantProductId', {
				length: 191,
			}).notNull(),
			createdAt: timestamp('createdAt', { mode: 'date', fsp: 3 })
				.default(sql`CURRENT_TIMESTAMP(3)`)
				.notNull(),
			merchantCustomerId: varchar('merchantCustomerId', {
				length: 191,
			}).notNull(),
		},
		(table) => {
			return {
				merchantChargeId: primaryKey({
					columns: [table.id],
					name: 'MerchantCharge_id',
				}),
				merchantChargeIdentifierKey: unique('MerchantCharge_identifier_key').on(
					table.identifier,
				),
				organizationIdIdx: index('organizationId_idx').on(table.organizationId),
			}
		},
	)
}

export function getMerchantChargeRelationsSchema(mysqlTable: MySqlTableFn) {
	const merchantCharge = getMerchantChargeSchema(mysqlTable)
	const merchantAccount = getMerchantAccountSchema(mysqlTable)
	const merchantProduct = getMerchantProductSchema(mysqlTable)
	const merchantCustomer = getMerchantCustomerSchema(mysqlTable)
	return relations(merchantCharge, ({ one }) => ({
		merchantAccount: one(merchantAccount, {
			fields: [merchantCharge.merchantAccountId],
			references: [merchantAccount.id],
			relationName: 'merchantAccount',
		}),
		merchantProduct: one(merchantProduct, {
			fields: [merchantCharge.merchantProductId],
			references: [merchantProduct.id],
			relationName: 'merchantProduct',
		}),
		merchantCustomer: one(merchantCustomer, {
			fields: [merchantCharge.merchantCustomerId],
			references: [merchantCustomer.id],
			relationName: 'merchantCustomer',
		}),
	}))
}
