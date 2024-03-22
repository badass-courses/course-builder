import {
	boolean,
	index,
	MySqlTableFn,
	primaryKey,
	timestamp,
	varchar,
} from 'drizzle-orm/mysql-core'

export const getRolePermissionsSchema = (mysqlTable: MySqlTableFn) => {
	const rolePermissions = mysqlTable(
		'rolePermission',
		{
			roleId: varchar('roleId', { length: 255 }).notNull(),
			permissionId: varchar('permissionId', { length: 255 }).notNull(),
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
		(rp) => ({
			pk: primaryKey({ columns: [rp.roleId, rp.permissionId] }),
			roleIdIdx: index('roleId_idx').on(rp.roleId),
			permissionIdIdx: index('permissionId_idx').on(rp.permissionId),
		}),
	)

	return { rolePermissions }
}
