import { mysqlTable } from '@/db/mysql-table'
import { env } from '@/env.mjs'
import { Client } from '@planetscale/database'
import {
	PlanetScaleDatabase,
	drizzle as planetscaleDrizzle,
} from 'drizzle-orm/planetscale-serverless'

import { DrizzleAdapter } from '@coursebuilder/adapter-drizzle'

import * as schema from './schema'

export const db: PlanetScaleDatabase<typeof schema> = planetscaleDrizzle(
	new Client({
		url: env.DATABASE_URL,
	}),
	{ schema },
)

export const courseBuilderAdapter = DrizzleAdapter(db, mysqlTable)
