import { relations, sql } from 'drizzle-orm'
import {
	decimal,
	index,
	json,
	MySqlTableFn,
	primaryKey,
	timestamp,
	unique,
	varchar,
} from 'drizzle-orm/mysql-core'

import { getUsersSchema } from '../auth/users.js'
import { getCouponSchema } from './coupon.js'
import { getMerchantChargeSchema } from './merchant-charge.js'
import { getMerchantSessionSchema } from './merchant-session.js'
import { getProductSchema } from './product.js'

export function getPurchaseSchema(mysqlTable: MySqlTableFn) {
	return mysqlTable(
		'Purchase',
		{
			id: varchar('id', { length: 191 }).notNull(),
			userId: varchar('userId', { length: 191 }),
			createdAt: timestamp('createdAt', { mode: 'date', fsp: 3 })
				.default(sql`CURRENT_TIMESTAMP(3)`)
				.notNull(),
			totalAmount: decimal('totalAmount', {
				precision: 65,
				scale: 30,
			}).notNull(),
			ipAddress: varchar('ip_address', { length: 191 }),
			city: varchar('city', { length: 191 }),
			state: varchar('state', { length: 191 }),
			country: varchar('country', { length: 191 }),
			couponId: varchar('couponId', { length: 191 }),
			productId: varchar('productId', { length: 191 }).notNull(),
			merchantChargeId: varchar('merchantChargeId', { length: 191 }),
			upgradedFromId: varchar('upgradedFromId', { length: 191 }),
			status: varchar('status', { length: 191 }).default('Valid').notNull(),
			bulkCouponId: varchar('bulkCouponId', { length: 191 }),
			merchantSessionId: varchar('merchantSessionId', { length: 191 }),
			redeemedBulkCouponId: varchar('redeemedBulkCouponId', { length: 191 }),
			fields: json('fields').$type<Record<string, any>>().default({}),
		},
		(table) => {
			return {
				purchaseId: primaryKey({ columns: [table.id], name: 'Purchase_id' }),
				merchantChargeIdIdx: index('idx_Purchase_on_merchantChargeId').on(
					table.merchantChargeId,
				),
				purchaseUpgradedFromIdKey: unique('Purchase_upgradedFromId_key').on(
					table.upgradedFromId,
				),
			}
		},
	)
}

export function getPurchaseRelationsSchema(mysqlTable: MySqlTableFn) {
	const purchases = getPurchaseSchema(mysqlTable)
	const users = getUsersSchema(mysqlTable)
	const products = getProductSchema(mysqlTable)
	const merchantCharges = getMerchantChargeSchema(mysqlTable)
	const merchantSessions = getMerchantSessionSchema(mysqlTable)
	const coupons = getCouponSchema(mysqlTable)

	return relations(purchases, ({ many, one }) => ({
		redeemedBulkCoupon: one(coupons, {
			fields: [purchases.redeemedBulkCouponId],
			references: [coupons.id],
			relationName: 'redeemedBulkCoupon',
		}),
		user: one(users, {
			fields: [purchases.userId],
			references: [users.id],
			relationName: 'user',
		}),
		product: one(products, {
			fields: [purchases.productId],
			references: [products.id],
			relationName: 'product',
		}),
		bulkCoupon: one(coupons, {
			fields: [purchases.bulkCouponId],
			references: [coupons.id],
			relationName: 'bulkCoupon',
		}),
		merchantCharge: one(merchantCharges, {
			fields: [purchases.merchantChargeId],
			references: [merchantCharges.id],
			relationName: 'merchantCharge',
		}),
		merchantSession: one(merchantSessions, {
			fields: [purchases.merchantSessionId],
			references: [merchantSessions.id],
			relationName: 'merchantSession',
		}),
	}))
}
