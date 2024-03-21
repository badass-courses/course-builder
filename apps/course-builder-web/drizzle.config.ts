import { env } from '@/env.mjs'
import { type Config } from 'drizzle-kit'

export default {
	schema: ['./src/db/schema.ts'],
	driver: 'mysql2',
	dbCredentials: {
		uri: env.DATABASE_URL,
	},
	tablesFilter: ['inngest-gpt_*'],
	out: './src/db/generated',
} satisfies Config
