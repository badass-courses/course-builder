import { mysqlTable } from '@/db/mysql-table'
import { rolePermissions } from '@/db/schemas/role-permissions'
import { relations } from 'drizzle-orm'
import {
	boolean,
	index,
	text,
	timestamp,
	varchar,
} from 'drizzle-orm/mysql-core'

export const permissions = mysqlTable(
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

export const permissionsRelations = relations(permissions, ({ many }) => ({
	rolePermissions: many(rolePermissions),
}))
