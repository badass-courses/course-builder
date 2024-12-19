import { relations } from 'drizzle-orm'
import {
	boolean,
	index,
	MySqlTableFn,
	text,
	timestamp,
	uniqueIndex,
	varchar,
} from 'drizzle-orm/mysql-core'

import { getUserRolesSchema } from './user-roles.js'

export function getRolesSchema(mysqlTable: MySqlTableFn) {
	return mysqlTable(
		'Role',
		{
			id: varchar('id', { length: 255 }).notNull().primaryKey(),
			organizationId: varchar('organizationId', { length: 191 }),
			name: varchar('name', { length: 255 }).notNull(),
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
		(role) => ({
			nameIdx: index('name_idx').on(role.name),
			organizationIdIdx: index('organizationId_idx').on(role.organizationId),
			uniqueNamePerOrg: uniqueIndex('unique_name_per_org').on(
				role.organizationId,
				role.name,
			),
		}),
	)
}

export function getRolesRelationsSchema(mysqlTable: MySqlTableFn) {
	const roles = getRolesSchema(mysqlTable)
	const userRoles = getUserRolesSchema(mysqlTable)

	return relations(roles, ({ many }) => ({
		userRoles: many(userRoles, { relationName: 'role' }),
	}))
}
