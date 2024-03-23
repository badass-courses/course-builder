import { mysqlTable } from '@/db/mysql-table'

import {
	getUsersRelationsSchema,
	getUsersSchema,
} from '@coursebuilder/adapter-drizzle/mysql'

export const users = getUsersSchema(mysqlTable)
export const usersRelations = getUsersRelationsSchema(mysqlTable)
