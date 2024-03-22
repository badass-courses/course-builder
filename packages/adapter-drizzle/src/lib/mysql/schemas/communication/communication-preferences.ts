import {
	boolean,
	index,
	mysqlEnum,
	MySqlTableFn,
	timestamp,
	varchar,
} from 'drizzle-orm/mysql-core'

export const getCommunicationPreferencesSchema = (mysqlTable: MySqlTableFn) => {
	const communicationPreferences = mysqlTable(
		'communicationPreference',
		{
			id: varchar('id', { length: 255 }).notNull().primaryKey(),
			userId: varchar('userId', { length: 255 }).notNull(),
			channelId: varchar('channelId', { length: 255 }).notNull(),
			preferenceLevel: mysqlEnum('preferenceLevel', ['low', 'medium', 'high'])
				.notNull()
				.default('medium'),
			preferenceTypeId: varchar('preferenceTypeId', { length: 255 }).notNull(),
			active: boolean('active').notNull().default(true),
			createdAt: timestamp('createdAt', {
				mode: 'date',
				fsp: 3,
			}).defaultNow(),
			optInAt: timestamp('optInAt', {
				mode: 'date',
				fsp: 3,
			}),
			optOutAt: timestamp('optOutAt', {
				mode: 'date',
				fsp: 3,
			}),
			updatedAt: timestamp('updatedAt', {
				mode: 'date',
				fsp: 3,
			}).defaultNow(),
			deletedAt: timestamp('deletedAt', {
				mode: 'date',
				fsp: 3,
			}),
		},
		(cp) => ({
			userIdIdx: index('userId_idx').on(cp.userId),
			preferenceTypeIdx: index('preferenceTypeId_idx').on(cp.preferenceTypeId),
			channelIdIdx: index('channelId_idx').on(cp.channelId),
		}),
	)

	return { communicationPreferences }
}
