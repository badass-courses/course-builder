import {
	boolean,
	index,
	MySqlTableFn,
	text,
	timestamp,
	varchar,
} from 'drizzle-orm/mysql-core'

export const getCommunicationChannelSchema = (mysqlTable: MySqlTableFn) => {
	const communicationChannel = mysqlTable(
		'communicationChannel',
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
			}).defaultNow(),
			deletedAt: timestamp('deletedAt', {
				mode: 'date',
				fsp: 3,
			}),
		},
		(cc) => ({
			nameIdx: index('name_idx').on(cc.name),
		}),
	)

	return { communicationChannel }
}
