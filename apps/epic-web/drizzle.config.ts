import { env } from '@/env.mjs'
import slugify from '@sindresorhus/slugify'
import { type Config } from 'drizzle-kit'

export default {
	schema: ['./src/db/schema.ts'],
	driver: 'mysql2',
	dbCredentials: {
		uri: env.DATABASE_URL,
	},
	tablesFilter: [`*`],
	out: './src/db/generated',
} satisfies Config
