import { sql } from 'drizzle-orm'
import {
	index,
	mysqlEnum,
	MySqlTableFn,
	timestamp,
	varchar,
} from 'drizzle-orm/mysql-core'

export function getUsersSchema(mysqlTable: MySqlTableFn) {
	const users = mysqlTable(
		'user',
		{
			id: varchar('id', { length: 255 }).notNull().primaryKey(),
			name: varchar('name', { length: 255 }),
			role: mysqlEnum('role', ['user', 'admin']).default('user'),
			email: varchar('email', { length: 255 }).notNull().unique(),
			emailVerified: timestamp('emailVerified', {
				mode: 'date',
				fsp: 3,
			}),
			image: varchar('image', { length: 255 }),
			createdAt: timestamp('createdAt', {
				mode: 'date',
				fsp: 3,
			}).default(sql`CURRENT_TIMESTAMP(3)`),
		},
		(user) => ({
			emailIdx: index('email_idx').on(user.email),
			roleIdx: index('role_idx').on(user.role),
		}),
	)

	return { users }
}
