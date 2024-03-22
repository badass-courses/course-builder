import { mysqlTable } from '@/db/mysql-table'
import { rolePermissions } from '@/db/schemas/auth/role-permissions'
import { relations } from 'drizzle-orm'

import { getPermissionsSchema } from '@coursebuilder/adapter-drizzle/mysql'

export const { permissions } = getPermissionsSchema(mysqlTable)

export const permissionsRelations = relations(permissions, ({ many }) => ({
	rolePermissions: many(rolePermissions),
}))
