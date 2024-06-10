import type { Config } from 'drizzle-kit'

export default {
	schema: './test/mysql/schema.ts',
	out: './test/mysql/.drizzle',
	dialect: 'mysql',
	dbCredentials: {
		host: '127.0.0.1',
		port: 3306,
		user: 'root',
		password: 'password',
		database: 'coursebuilder',
	},
} satisfies Config
