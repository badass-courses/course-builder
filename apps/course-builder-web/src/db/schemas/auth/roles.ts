import { mysqlTable } from '@/db/mysql-table'
import { userRoles } from '@/db/schemas/auth/user-roles'
import { relations } from 'drizzle-orm'

import { getRolesSchema } from '@coursebuilder/adapter-drizzle/mysql'

export const { roles } = getRolesSchema(mysqlTable)

export const rolesRelations = relations(roles, ({ many }) => ({
	userRoles: many(userRoles),
}))
