import { mysqlTable } from '@/db/mysql-table'
import { accounts } from '@/db/schemas/accounts'
import { communicationPreferences } from '@/db/schemas/communication-preferences'
import { contentContributions } from '@/db/schemas/content-contributions'
import { contentResource } from '@/db/schemas/content-resource'
import { userPermissions } from '@/db/schemas/user-permissions'
import { userRoles } from '@/db/schemas/user-roles'
import { relations, sql } from 'drizzle-orm'
import { index, mysqlEnum, timestamp, varchar } from 'drizzle-orm/mysql-core'

export const users = mysqlTable(
	'user',
	{
		id: varchar('id', { length: 255 }).notNull().primaryKey(),
		name: varchar('name', { length: 255 }),
		role: mysqlEnum('role', ['user', 'admin']).default('user'),
		email: varchar('email', { length: 255 }).notNull().unique(),
		emailVerified: timestamp('emailVerified', {
			mode: 'date',
			fsp: 3,
		}),
		image: varchar('image', { length: 255 }),
		createdAt: timestamp('createdAt', {
			mode: 'date',
			fsp: 3,
		}).default(sql`CURRENT_TIMESTAMP(3)`),
	},
	(user) => ({
		emailIdx: index('email_idx').on(user.email),
		roleIdx: index('role_idx').on(user.role),
	}),
)

export const usersRelations = relations(users, ({ many }) => ({
	accounts: many(accounts),
	communicationPreferences: many(communicationPreferences),
	userRoles: many(userRoles),
	userPermissions: many(userPermissions),
	contributions: many(contentContributions),
	createdContent: many(contentResource),
}))
