import { mysqlTable } from '@/db/mysql-table'
import { env } from '@/env.mjs'
import { drizzle } from 'drizzle-orm/mysql2'
import { createPool, Pool } from 'mysql2/promise'

import { DrizzleAdapter } from '@coursebuilder/adapter-drizzle'

import * as schema from './schema'

const globalForDb = globalThis as unknown as {
	conn: Pool | undefined
}

const conn = globalForDb.conn ?? createPool({ uri: env.DATABASE_URL })
if (env.NODE_ENV !== 'production') globalForDb.conn = conn

export const db = drizzle(conn, { schema, mode: 'default' })

export const courseBuilderAdapter = DrizzleAdapter(db, mysqlTable)
