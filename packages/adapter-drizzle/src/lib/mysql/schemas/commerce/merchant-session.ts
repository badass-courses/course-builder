import {
	index,
	MySqlTableFn,
	primaryKey,
	varchar,
} from 'drizzle-orm/mysql-core'

export function getMerchantSessionSchema(mysqlTable: MySqlTableFn) {
	return mysqlTable(
		'MerchantSession',
		{
			id: varchar('id', { length: 191 }).notNull(),
			organizationId: varchar('organizationId', { length: 191 }),
			identifier: varchar('identifier', { length: 191 }).notNull(),
			merchantAccountId: varchar('merchantAccountId', {
				length: 191,
			}).notNull(),
		},
		(table) => {
			return {
				merchantSessionId: primaryKey({
					columns: [table.id],
					name: 'MerchantSession_id',
				}),
				organizationIdIdx: index('organizationId_idx').on(table.organizationId),
			}
		},
	)
}
