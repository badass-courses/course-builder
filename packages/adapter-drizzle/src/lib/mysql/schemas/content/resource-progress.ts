import { sql } from 'drizzle-orm'
import {
	datetime,
	index,
	json,
	MySqlTableFn,
	primaryKey,
	varchar,
} from 'drizzle-orm/mysql-core'

export const getResourceProgressSchema = (mysqlTable: MySqlTableFn) => {
	const resourceProgress = mysqlTable(
		'resourceProgresses',
		{
			userId: varchar('userId', { length: 191 }).notNull(),
			contentResourceId: varchar('contentResourceId', { length: 191 }),
			metadata: json('fields').$type<Record<string, any>>().default({}),
			completedAt: datetime('completedAt', { mode: 'string', fsp: 3 }),
			updatedAt: datetime('updatedAt', { mode: 'string', fsp: 3 }),
			createdAt: datetime('createdAt', { mode: 'string', fsp: 3 })
				.default(sql`CURRENT_TIMESTAMP(3)`)
				.notNull(),
		},
		(crp) => {
			return {
				userIdLessonIdIdx: index('crp_userId_contentResourceId_idx').on(
					crp.userId,
					crp.contentResourceId,
				),
				pk: primaryKey({ columns: [crp.userId, crp.contentResourceId] }),
				contentResourceIdIdx: index('contentResourceId_idx').on(
					crp.contentResourceId,
				),
				userIdIdx: index('resourceId_idx').on(crp.userId),
			}
		},
	)

	return { resourceProgress }
}
