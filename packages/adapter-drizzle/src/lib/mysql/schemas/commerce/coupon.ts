import { relations, sql } from 'drizzle-orm'
import {
	boolean,
	decimal,
	index,
	int,
	json,
	MySqlTableFn,
	primaryKey,
	timestamp,
	unique,
	varchar,
} from 'drizzle-orm/mysql-core'

import { getMerchantCouponSchema } from './merchant-coupon.js'
import { getProductSchema } from './product.js'
import { getPurchaseSchema } from './purchase.js'

export function getCouponSchema(mysqlTable: MySqlTableFn) {
	return mysqlTable(
		'Coupon',
		{
			id: varchar('id', { length: 191 }).notNull(),
			organizationId: varchar('organizationId', { length: 191 }),
			code: varchar('code', { length: 191 }),
			createdAt: timestamp('createdAt', { mode: 'date', fsp: 3 })
				.default(sql`CURRENT_TIMESTAMP(3)`)
				.notNull(),
			expires: timestamp('expires', { mode: 'date', fsp: 3 }),
			fields: json('fields').$type<Record<string, any>>().default({}),
			maxUses: int('maxUses').default(-1).notNull(),
			default: boolean('default').default(false).notNull(),
			merchantCouponId: varchar('merchantCouponId', { length: 191 }),
			status: int('status').default(0).notNull(),
			usedCount: int('usedCount').default(0).notNull(),
			percentageDiscount: decimal('percentageDiscount', {
				precision: 3,
				scale: 2,
			}),
			amountDiscount: int('amountDiscount'),
			restrictedToProductId: varchar('restrictedToProductId', { length: 191 }),
		},
		(table) => {
			return {
				couponIdCodeIndex: index('Coupon_id_code_index').on(
					table.id,
					table.code,
				),
				couponId: primaryKey({ columns: [table.id], name: 'Coupon_id' }),
				couponCodeKey: unique('Coupon_code_key').on(table.code),
				organizationIdIdx: index('organizationId_idx').on(table.organizationId),
			}
		},
	)
}

export function getCouponRelationsSchema(mysqlTable: MySqlTableFn) {
	const purchase = getPurchaseSchema(mysqlTable)
	const coupon = getCouponSchema(mysqlTable)
	const merchantCoupon = getMerchantCouponSchema(mysqlTable)
	return relations(coupon, ({ many, one }) => ({
		redeemedBulkCouponPurchases: many(purchase, {
			relationName: 'redeemedBulkCoupon',
		}),
		merchantCoupon: one(merchantCoupon, {
			fields: [coupon.merchantCouponId],
			references: [merchantCoupon.id],
			relationName: 'merchantCoupon',
		}),
		product: one(getProductSchema(mysqlTable), {
			fields: [coupon.restrictedToProductId],
			references: [getProductSchema(mysqlTable).id],
			relationName: 'product',
		}),
		bulkPurchases: many(purchase, {
			relationName: 'bulkCoupon',
		}),
	}))
}
