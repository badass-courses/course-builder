import { mysqlTable } from '@/db/mysql-table'
import { userRoles } from '@/db/schemas/user-roles'
import { relations } from 'drizzle-orm'
import {
	boolean,
	index,
	text,
	timestamp,
	varchar,
} from 'drizzle-orm/mysql-core'

export const roles = mysqlTable(
	'role',
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
	(role) => ({
		nameIdx: index('name_idx').on(role.name),
	}),
)

export const rolesRelations = relations(roles, ({ many }) => ({
	userRoles: many(userRoles),
}))
