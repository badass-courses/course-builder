import { mysqlTable } from '@/db/mysql-table'
import { roles } from '@/db/schemas/auth/roles'
import { users } from '@/db/schemas/auth/users'
import { relations } from 'drizzle-orm'

import { getUserRolesSchema } from '@coursebuilder/adapter-drizzle/mysql'

export const { userRoles } = getUserRolesSchema(mysqlTable)

export const userRolesRelations = relations(userRoles, ({ one }) => ({
	user: one(users, { fields: [userRoles.userId], references: [users.id] }),
	role: one(roles, { fields: [userRoles.roleId], references: [roles.id] }),
}))
