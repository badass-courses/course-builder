import {
	boolean,
	index,
	MySqlTableFn,
	timestamp,
	varchar,
} from 'drizzle-orm/mysql-core'

export const getContentContributionsSchema = (mysqlTable: MySqlTableFn) => {
	const contentContributions = mysqlTable(
		'contentContribution',
		{
			id: varchar('id', { length: 255 }).notNull().primaryKey(),
			userId: varchar('userId', { length: 255 }).notNull(),
			contentId: varchar('contentId', { length: 255 }).notNull(),
			contributionTypeId: varchar('contributionTypeId', {
				length: 255,
			}).notNull(),
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
			userIdIdx: index('userId_idx').on(cc.userId),
			contentIdIdx: index('contentId_idx').on(cc.contentId),
			contributionTypeIdIdx: index('contributionTypeId_idx').on(
				cc.contributionTypeId,
			),
		}),
	)
	return { contentContributions }
}
