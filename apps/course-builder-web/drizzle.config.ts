import { env } from '@/env.mjs'
import slugify from '@sindresorhus/slugify'
import { type Config } from 'drizzle-kit'

export default {
	schema: ['./src/db/schema.ts'],
	dialect: 'mysql',
	dbCredentials: {
		url: env.DATABASE_URL,
	},
	tablesFilter: [
		`${env.NEXT_PUBLIC_APP_NAME ? `${slugify(env.NEXT_PUBLIC_APP_NAME)}_` : ''}*`,
	],
	out: './src/db/generated',
} satisfies Config
