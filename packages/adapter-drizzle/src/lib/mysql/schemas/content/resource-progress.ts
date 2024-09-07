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
			userId: varchar('userId', { length: 255 }).notNull(),
			resourceId: varchar('resourceId', { length: 255 }),
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
					crp.resourceId,
				),
				pk: primaryKey({ columns: [crp.userId, crp.resourceId] }),
				contentResourceIdIdx: index('contentResourceId_idx').on(crp.resourceId),
				userIdIdx: index('resourceId_idx').on(crp.userId),
			}
		},
	)
}
