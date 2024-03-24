import { relations } from 'drizzle-orm'
import {
	boolean,
	index,
	MySqlTableFn,
	text,
	timestamp,
	varchar,
} from 'drizzle-orm/mysql-core'

import { getRolePermissionsSchema } from './role-permissions.js'

export function getPermissionsSchema(mysqlTable: MySqlTableFn) {
	return mysqlTable(
		'permission',
		{
			id: varchar('id', { length: 255 }).notNull().primaryKey(),
			name: varchar('name', { length: 255 }).notNull().unique(),
			description: text('description'),
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
		(permission) => ({
			nameIdx: index('name_idx').on(permission.name),
		}),
	)
}

export function getPermissionsRelationsSchema(mysqlTable: MySqlTableFn) {
	return relations(getPermissionsSchema(mysqlTable), ({ many }) => ({
		rolePermissions: many(getRolePermissionsSchema(mysqlTable)),
	}))
}
