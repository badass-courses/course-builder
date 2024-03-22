import {
	boolean,
	MySqlTableFn,
	text,
	timestamp,
	varchar,
} from 'drizzle-orm/mysql-core'

export const getCommunicationPreferenceTypesSchema = (
	mysqlTable: MySqlTableFn,
) => {
	const communicationPreferenceTypes = mysqlTable(
		'communicationPreferenceType',
		{
			id: varchar('id', { length: 255 }).notNull().primaryKey(),
			name: varchar('name', { length: 255 }).notNull(),
			description: text('description'),
			active: boolean('active').notNull().default(true),
			createdAt: timestamp('createdAt', {
				mode: 'date',
				fsp: 3,
			}).defaultNow(),
			updatedAt: timestamp('updatedAt', {
				mode: 'date',
				fsp: 3,
			}),
			deletedAt: timestamp('deletedAt', {
				mode: 'date',
				fsp: 3,
			}),
		},
	)

	return { communicationPreferenceTypes }
}
