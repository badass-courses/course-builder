import { Client } from '@planetscale/database'
import { MySqlDatabase } from 'drizzle-orm/mysql-core'
import { drizzle } from 'drizzle-orm/planetscale-serverless'

import { DrizzleAdapter } from '@coursebuilder/adapter-drizzle'

import { mysqlTable } from './mysql-table'
import * as schema from './schema'

export const db = drizzle(
	new Client({
		url: process.env.DATABASE_URL,
	}),
	{ schema },
)

export const courseBuilderAdapter = DrizzleAdapter<
	MySqlDatabase<any, any, any>
>(db, mysqlTable)
