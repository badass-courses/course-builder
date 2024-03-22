import { mysqlTable } from '@/db/mysql-table'
import { accounts } from '@/db/schemas/auth/accounts'
import { userPermissions } from '@/db/schemas/auth/user-permissions'
import { userRoles } from '@/db/schemas/auth/user-roles'
import { communicationPreferences } from '@/db/schemas/communication/communication-preferences'
import { contentContributions } from '@/db/schemas/content/content-contributions'
import { contentResource } from '@/db/schemas/content/content-resource'
import { relations } from 'drizzle-orm'

import { getUsersSchema } from '@coursebuilder/adapter-drizzle/mysql'

export const { users } = getUsersSchema(mysqlTable)

export const usersRelations = relations(users, ({ many }) => ({
	accounts: many(accounts),
	communicationPreferences: many(communicationPreferences),
	userRoles: many(userRoles),
	userPermissions: many(userPermissions),
	contributions: many(contentContributions),
	createdContent: many(contentResource),
}))
