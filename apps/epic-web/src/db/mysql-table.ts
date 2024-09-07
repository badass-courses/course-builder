import { mysqlTableCreator } from 'drizzle-orm/mysql-core'

/**
 * the database uses an uppercase format for the table names
 */
export const mysqlTable = mysqlTableCreator(
	(name) => `${name.charAt(0).toUpperCase()}${name.slice(1)}`,
)
