import { mysqlTable } from '@/db/mysql-table'
import { sql } from 'drizzle-orm'
import {
	datetime,
	decimal,
	json,
	primaryKey,
	unique,
	varchar,
} from 'drizzle-orm/mysql-core'

import { getPurchaseSchema } from '@coursebuilder/adapter-drizzle/mysql'

export const { purchase } = getPurchaseSchema(mysqlTable)
