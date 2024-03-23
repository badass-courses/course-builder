import { mysqlTable } from '@/db/mysql-table'

import {
	getAccountsRelationsSchema,
	getAccountsSchema,
} from '@coursebuilder/adapter-drizzle/mysql'

export const accounts = getAccountsSchema(mysqlTable)

export const accountsRelations = getAccountsRelationsSchema(mysqlTable)
