import { stripeProvider } from '@/coursebuilder/stripe-provider'
import { mysqlTable } from '@/db/mysql-table'
import { env } from '@/env.mjs'
import { Client } from '@planetscale/database'
import { drizzle } from 'drizzle-orm/planetscale-serverless'

import { DrizzleAdapter } from '@coursebuilder/adapter-drizzle'

import * as schema from './schema'

export const db = drizzle(
	new Client({
		url: env.DATABASE_URL,
	}),
	{ schema },
)

export const courseBuilderAdapter = DrizzleAdapter(
	db,
	mysqlTable,
	stripeProvider,
)
