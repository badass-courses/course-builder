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
import { getUsersSchema } from './users.js'

export function getUserPermissionsSchema(mysqlTable: MySqlTableFn) {
	return mysqlTable(
		'UserPermission',
		{
			userId: varchar('userId', { length: 255 }).notNull(),
			organizationId: varchar('organizationId', { length: 191 }),
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
			organizationIdIdx: index('organizationId_idx').on(up.organizationId),
		}),
	)
}

export function getUserPermissionsRelationsSchema(mysqlTable: MySqlTableFn) {
	const userPermissions = getUserPermissionsSchema(mysqlTable)
	const users = getUsersSchema(mysqlTable)
	const permissions = getPermissionsSchema(mysqlTable)
	return relations(userPermissions, ({ one }) => ({
		user: one(users, {
			fields: [userPermissions.userId],
			references: [users.id],
			relationName: 'user',
		}),
		permission: one(permissions, {
			fields: [userPermissions.permissionId],
			references: [permissions.id],
			relationName: 'permission',
		}),
	}))
}
