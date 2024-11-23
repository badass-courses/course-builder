import { env } from '@/env.mjs'
import { type Config } from 'drizzle-kit'

export default {
	schema: ['./src/db/schema.ts'],
	dialect: 'mysql',
	dbCredentials: {
		url: env.DATABASE_URL,
	},
	tablesFilter: [`GLF_*`],
	out: './src/db/generated',
} satisfies Config
