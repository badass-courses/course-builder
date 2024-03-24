import { relations } from 'drizzle-orm'
import {
	boolean,
	index,
	MySqlTableFn,
	primaryKey,
	timestamp,
	varchar,
} from 'drizzle-orm/mysql-core'

import { getRolesSchema } from './roles.js'
import { getUsersSchema } from './users.js'

export function getUserRolesSchema(mysqlTable: MySqlTableFn) {
	return mysqlTable(
		'userRole',
		{
			userId: varchar('userId', { length: 255 }).notNull(),
			roleId: varchar('roleId', { length: 255 }).notNull(),
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
		(ur) => ({
			pk: primaryKey({ columns: [ur.userId, ur.roleId] }),
			userIdIdx: index('userId_idx').on(ur.userId),
			roleIdIdx: index('roleId_idx').on(ur.roleId),
		}),
	)
}

export function getUserRolesRelationsSchema(mysqlTable: MySqlTableFn) {
	const userRoles = getUserRolesSchema(mysqlTable)
	const users = getUsersSchema(mysqlTable)
	const roles = getRolesSchema(mysqlTable)
	return relations(userRoles, ({ one }) => ({
		user: one(users, {
			fields: [userRoles.userId],
			references: [users.id],
		}),
		role: one(roles, {
			fields: [userRoles.roleId],
			references: [roles.id],
		}),
	}))
}
