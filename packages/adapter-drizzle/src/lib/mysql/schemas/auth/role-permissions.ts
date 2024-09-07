import { relations } from 'drizzle-orm'
import {
	boolean,
	index,
	MySqlTableFn,
	primaryKey,
	timestamp,
	varchar,
} from 'drizzle-orm/mysql-core'

import { getPermissionsSchema } from './permissions.js'
import { getRolesSchema } from './roles.js'

export function getRolePermissionsSchema(mysqlTable: MySqlTableFn) {
	return mysqlTable(
		'RolePermission',
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
}

export function getRolePermissionsRelationsSchema(mysqlTable: MySqlTableFn) {
	const permissions = getPermissionsSchema(mysqlTable)
	const roles = getRolesSchema(mysqlTable)
	const rolePermissions = getRolePermissionsSchema(mysqlTable)
	return relations(rolePermissions, ({ one }) => ({
		role: one(roles, {
			fields: [rolePermissions.roleId],
			references: [roles.id],
			relationName: 'role',
		}),
		permission: one(permissions, {
			fields: [rolePermissions.permissionId],
			references: [permissions.id],
			relationName: 'permission',
		}),
	}))
}
