import {
	decimal,
	index,
	int,
	MySqlTableFn,
	primaryKey,
	unique,
	varchar,
} from 'drizzle-orm/mysql-core'

export function getMerchantCouponSchema(mysqlTable: MySqlTableFn) {
	return mysqlTable(
		'MerchantCoupon',
		{
			id: varchar('id', { length: 191 }).notNull(),
			identifier: varchar('identifier', { length: 191 }),
			organizationId: varchar('organizationId', { length: 191 }),
			status: int('status').default(0).notNull(),
			merchantAccountId: varchar('merchantAccountId', {
				length: 191,
			}).notNull(),
			percentageDiscount: decimal('percentageDiscount', {
				precision: 3,
				scale: 2,
			}),
			amountDiscount: int('amountDiscount'),
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
				organizationIdIdx: index('organizationId_idx').on(table.organizationId),
			}
		},
	)
}
