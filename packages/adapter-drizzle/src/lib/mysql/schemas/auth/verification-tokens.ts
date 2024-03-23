import {
	MySqlTableFn,
	primaryKey,
	timestamp,
	varchar,
} from 'drizzle-orm/mysql-core'

export function getVerificationTokensSchema(mysqlTable: MySqlTableFn) {
	return mysqlTable(
		'verificationToken',
		{
			identifier: varchar('identifier', { length: 255 }).notNull(),
			token: varchar('token', { length: 255 }).notNull(),
			expires: timestamp('expires', { mode: 'date' }).notNull(),
			createdAt: timestamp('createdAt', {
				mode: 'date',
				fsp: 3,
			}).defaultNow(),
		},
		(vt) => ({
			pk: primaryKey({ columns: [vt.identifier, vt.token] }),
		}),
	)
}
