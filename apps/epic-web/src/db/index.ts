import { stripeProvider } from '@/coursebuilder/stripe-provider'
import { mysqlTable } from '@/db/mysql-table'
import { env } from '@/env.mjs'
import { Client } from '@planetscale/database'
import { MySqlDatabase } from 'drizzle-orm/mysql-core'
import { drizzle as drizzleMysql2 } from 'drizzle-orm/mysql2'
import { drizzle } from 'drizzle-orm/planetscale-serverless'
import { createPool } from 'mysql2/promise'

import { DrizzleAdapter } from '@coursebuilder/adapter-drizzle'

import * as schema from './schema'

/**
 * Returns `true` when the configured database URL should use the PlanetScale
 * serverless driver.
 */
function isPlanetscaleUrl(url: string): boolean {
	return url.includes('psdb.cloud') || url.startsWith('https://')
}

const dbConnection = isPlanetscaleUrl(env.DATABASE_URL)
	? drizzle(
			new Client({
				url: env.DATABASE_URL,
			}),
			{ schema },
		)
	: drizzleMysql2(createPool(env.DATABASE_URL), { schema })

export const db: MySqlDatabase<any, any, any> = dbConnection

export const courseBuilderAdapter = DrizzleAdapter<
	MySqlDatabase<any, any, any>
>(db, mysqlTable, stripeProvider)
