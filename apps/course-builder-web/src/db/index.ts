import { mysqlTable } from '@/db/mysql-table'
import { env } from '@/env.mjs'
import { Client } from '@planetscale/database'
import { MySql2Database, drizzle as mysql2Drizzle } from 'drizzle-orm/mysql2'
import {
	PlanetScaleDatabase,
	drizzle as planetscaleDrizzle,
} from 'drizzle-orm/planetscale-serverless'
import mysql, { createPool, Pool } from 'mysql2/promise'

import { DrizzleAdapter } from '@coursebuilder/adapter-drizzle'

import * as schema from './schema'

let db: PlanetScaleDatabase<typeof schema> | MySql2Database<typeof schema>

if (process.env.USE_LOCAL_MYSQL) {
	const globalForDb = globalThis as unknown as {
		conn: Pool | undefined
	}

	const conn = globalForDb.conn ?? createPool({ uri: env.DATABASE_URL })
	if (env.NODE_ENV !== 'production') globalForDb.conn = conn

	db = mysql2Drizzle(conn, { schema, mode: 'default' })
} else {
	const planetscale = planetscaleDrizzle(
		new Client({
			url: env.DATABASE_URL,
		}),
		{ schema },
	)

	db = planetscale
}

export { db }

export const courseBuilderAdapter = DrizzleAdapter(db, mysqlTable)
