import {
	boolean,
	index,
	MySqlTableFn,
	primaryKey,
	timestamp,
	varchar,
} from 'drizzle-orm/mysql-core'

export const getUserRolesSchema = (mysqlTable: MySqlTableFn) => {
	const userRoles = mysqlTable(
		'userRole',
		{
			userId: varchar('userId', { length: 255 }).notNull(),
			roleId: varchar('roleId', { length: 255 }).notNull(),
			active: boolean('active').notNull().default(true),
			createdAt: timestamp('createdAt', {
				mode: 'date',
				fsp: 3,
			}).defaultNow(),
			updatedAt: timestamp('updatedAt', {
				mode: 'date',
				fsp: 3,
			}).defaultNow(),
			deletedAt: timestamp('deletedAt', {
				mode: 'date',
				fsp: 3,
			}),
		},
		(ur) => ({
			pk: primaryKey({ columns: [ur.userId, ur.roleId] }),
			userIdIdx: index('userId_idx').on(ur.userId),
			roleIdIdx: index('roleId_idx').on(ur.roleId),
		}),
	)

	return { userRoles }
}
