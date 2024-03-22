import { mysqlTable } from '@/db/mysql-table'
import { sql } from 'drizzle-orm'
import {
	datetime,
	decimal,
	json,
	primaryKey,
	unique,
	varchar,
} from 'drizzle-orm/mysql-core'

export const purchase = mysqlTable(
	'purchases',
	{
		id: varchar('id', { length: 191 }).notNull(),
		userId: varchar('userId', { length: 191 }),
		createdAt: datetime('createdAt', { mode: 'string', fsp: 3 })
			.default(sql`CURRENT_TIMESTAMP(3)`)
			.notNull(),
		totalAmount: decimal('totalAmount', { precision: 65, scale: 30 }).notNull(),
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
		metadata: json('fields').$type<Record<string, any>>().default({}),
	},
	(table) => {
		return {
			purchaseId: primaryKey({ columns: [table.id], name: 'Purchase_id' }),
			purchaseUpgradedFromIdKey: unique('Purchase_upgradedFromId_key').on(
				table.upgradedFromId,
			),
		}
	},
)
