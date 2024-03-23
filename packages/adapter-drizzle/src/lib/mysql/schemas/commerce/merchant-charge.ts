import { sql } from 'drizzle-orm'
import {
	datetime,
	int,
	MySqlTableFn,
	primaryKey,
	unique,
	varchar,
} from 'drizzle-orm/mysql-core'

export function getMerchantChargeSchema(mysqlTable: MySqlTableFn) {
	return mysqlTable(
		'merchantCharges',
		{
			id: varchar('id', { length: 191 }).notNull(),
			status: int('status').default(0).notNull(),
			identifier: varchar('identifier', { length: 191 }).notNull(),
			userId: varchar('userId', { length: 191 }).notNull(),
			merchantAccountId: varchar('merchantAccountId', {
				length: 191,
			}).notNull(),
			merchantProductId: varchar('merchantProductId', {
				length: 191,
			}).notNull(),
			createdAt: datetime('createdAt', { mode: 'string', fsp: 3 })
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
			}
		},
	)
}
