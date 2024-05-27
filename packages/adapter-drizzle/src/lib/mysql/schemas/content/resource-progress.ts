import { sql } from 'drizzle-orm'
import {
	datetime,
	index,
	json,
	MySqlTableFn,
	primaryKey,
	varchar,
} from 'drizzle-orm/mysql-core'

export function getResourceProgressSchema(mysqlTable: MySqlTableFn) {
	return mysqlTable(
		'ResourceProgress',
		{
			userId: varchar('userId', { length: 191 }).notNull(),
			contentResourceId: varchar('contentResourceId', { length: 191 }),
			fields: json('fields').$type<Record<string, any>>().default({}),
			completedAt: datetime('completedAt', { mode: 'date', fsp: 3 }),
			updatedAt: datetime('updatedAt', { mode: 'date', fsp: 3 }),
			createdAt: datetime('createdAt', { mode: 'date', fsp: 3 })
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
}
