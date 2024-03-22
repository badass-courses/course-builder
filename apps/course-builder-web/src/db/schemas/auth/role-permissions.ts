import { mysqlTable } from '@/db/mysql-table'
import { permissions } from '@/db/schemas/auth/permissions'
import { roles } from '@/db/schemas/auth/roles'
import { relations } from 'drizzle-orm'
import {
	boolean,
	index,
	primaryKey,
	timestamp,
	varchar,
} from 'drizzle-orm/mysql-core'

export const rolePermissions = mysqlTable(
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
