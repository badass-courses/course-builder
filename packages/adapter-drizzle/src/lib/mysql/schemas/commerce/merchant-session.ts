import { MySqlTableFn, primaryKey, varchar } from 'drizzle-orm/mysql-core'

export const getMerchantSessionSchema = (mysqlTable: MySqlTableFn) => {
	const merchantSession = mysqlTable(
		'merchantSessions',
		{
			id: varchar('id', { length: 191 }).notNull(),
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
			}
		},
	)

	return { merchantSession }
}
