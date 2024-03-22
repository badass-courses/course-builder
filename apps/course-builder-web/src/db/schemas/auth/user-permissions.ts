import { mysqlTable } from '@/db/mysql-table'
import { permissions } from '@/db/schemas/auth/permissions'
import { users } from '@/db/schemas/auth/users'
import { relations } from 'drizzle-orm'

import { getUserPermissionsSchema } from '@coursebuilder/adapter-drizzle/mysql'

export const { userPermissions } = getUserPermissionsSchema(mysqlTable)

export const userPermissionsRelations = relations(
	userPermissions,
	({ one }) => ({
		user: one(users, {
			fields: [userPermissions.userId],
			references: [users.id],
		}),
		permission: one(permissions, {
			fields: [userPermissions.permissionId],
			references: [permissions.id],
		}),
	}),
)
