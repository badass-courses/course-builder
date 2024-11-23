import { env } from '@/env.mjs'
import { type Config } from 'drizzle-kit'

export default {
	schema: ['./src/db/schema.ts'],
	dialect: 'mysql',
	dbCredentials: {
		url: env.DATABASE_URL,
	},
	tablesFilter: [`${env.TABLE_PREFIX ? `${env.TABLE_PREFIX}_` : ''}*`],
	out: './src/db/generated',
} satisfies Config
