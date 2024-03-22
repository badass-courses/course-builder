import { mysqlTable } from '@/db/mysql-table'
import { permissions } from '@/db/schemas/auth/permissions'
import { roles } from '@/db/schemas/auth/roles'
import { relations } from 'drizzle-orm'

import { getRolePermissionsSchema } from '@coursebuilder/adapter-drizzle/mysql'

export const { rolePermissions } = getRolePermissionsSchema(mysqlTable)

export const rolePermissionsRelations = relations(
	rolePermissions,
	({ one }) => ({
		role: one(roles, {
			fields: [rolePermissions.roleId],
			references: [roles.id],
		}),
		permission: one(permissions, {
			fields: [rolePermissions.permissionId],
			references: [permissions.id],
		}),
	}),
)
