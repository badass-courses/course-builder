import {
	MySqlTableFn,
	text,
	uniqueIndex,
	varchar,
} from 'drizzle-orm/mysql-core'

export function getEntitlementTypesSchema(mysqlTable: MySqlTableFn) {
	return mysqlTable(
		'EntitlementType',
		{
			id: varchar('id', { length: 191 }).notNull().primaryKey(),
			name: varchar('name', { length: 255 }).notNull(),
			description: text('description'),
			// Add any type-specific config fields here
		},
		(table) => ({
			uniqueName: uniqueIndex('unique_name_idx').on(table.name),
		}),
	)
}
