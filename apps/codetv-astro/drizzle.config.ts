import { type Config } from 'drizzle-kit'

export default {
	schema: ['./src/db/schema.ts'],
	dialect: 'mysql',
	dbCredentials: {
		url: process.env.DATABASE_URL!,
	},
	tablesFilter: [`ctv_*`],
	out: './src/db/generated',
} satisfies Config
