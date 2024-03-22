import { mysqlTable } from '@/db/mysql-table'
import { sql } from 'drizzle-orm'
import {
	datetime,
	decimal,
	int,
	json,
	primaryKey,
	tinyint,
	unique,
	varchar,
} from 'drizzle-orm/mysql-core'

export const coupon = mysqlTable(
	'coupons',
	{
		id: varchar('id', { length: 191 }).notNull(),
		code: varchar('code', { length: 191 }),
		createdAt: datetime('createdAt', { mode: 'string', fsp: 3 })
			.default(sql`CURRENT_TIMESTAMP(3)`)
			.notNull(),
		expires: datetime('expires', { mode: 'string', fsp: 3 }),
		metadata: json('fields').$type<Record<string, any>>().default({}),
		maxUses: int('maxUses').default(-1).notNull(),
		default: tinyint('default').default(0).notNull(),
		merchantCouponId: varchar('merchantCouponId', { length: 191 }),
		status: int('status').default(0).notNull(),
		usedCount: int('usedCount').default(0).notNull(),
		percentageDiscount: decimal('percentageDiscount', {
			precision: 3,
			scale: 2,
		}).notNull(),
		restrictedToProductId: varchar('restrictedToProductId', { length: 191 }),
		bulkPurchaseId: varchar('bulkPurchaseId', { length: 191 }),
	},
	(table) => {
		return {
			couponId: primaryKey({ columns: [table.id], name: 'Coupon_id' }),
			couponBulkPurchaseIdKey: unique('Coupon_bulkPurchaseId_key').on(
				table.bulkPurchaseId,
			),
			couponCodeKey: unique('Coupon_code_key').on(table.code),
		}
	},
)
