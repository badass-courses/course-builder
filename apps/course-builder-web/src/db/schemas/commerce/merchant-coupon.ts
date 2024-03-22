import { mysqlTable } from '@/db/mysql-table'
import {
	decimal,
	int,
	primaryKey,
	unique,
	varchar,
} from 'drizzle-orm/mysql-core'

export const merchantCoupon = mysqlTable(
	'merchantCoupons',
	{
		id: varchar('id', { length: 191 }).notNull(),
		identifier: varchar('identifier', { length: 191 }),
		status: int('status').default(0).notNull(),
		merchantAccountId: varchar('merchantAccountId', { length: 191 }).notNull(),
		percentageDiscount: decimal('percentageDiscount', {
			precision: 3,
			scale: 2,
		}).notNull(),
		type: varchar('type', { length: 191 }),
	},
	(table) => {
		return {
			merchantCouponId: primaryKey({
				columns: [table.id],
				name: 'MerchantCoupon_id',
			}),
			merchantCouponIdentifierKey: unique('MerchantCoupon_identifier_key').on(
				table.identifier,
			),
		}
	},
)
