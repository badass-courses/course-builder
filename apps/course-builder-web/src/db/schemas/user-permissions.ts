import { mysqlTable } from '@/db/mysql-table'
import { permissions } from '@/db/schemas/permissions'
import { users } from '@/db/schemas/users'
import { relations } from 'drizzle-orm'
import {
	boolean,
	index,
	primaryKey,
	timestamp,
	varchar,
} from 'drizzle-orm/mysql-core'

export const userPermissions = mysqlTable(
	'userPermission',
	{
		userId: varchar('userId', { length: 255 }).notNull(),
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
	(up) => ({
		pk: primaryKey({ columns: [up.userId, up.permissionId] }),
		userIdIdx: index('userId_idx').on(up.userId),
		permissionIdIdx: index('permissionId_idx').on(up.permissionId),
	}),
)

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
