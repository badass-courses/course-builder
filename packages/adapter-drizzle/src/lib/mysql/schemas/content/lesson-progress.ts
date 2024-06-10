import { sql } from 'drizzle-orm'
import {
	datetime,
	index,
	json,
	MySqlTableFn,
	primaryKey,
	varchar,
} from 'drizzle-orm/mysql-core'

export function getLessonProgressSchema(mysqlTable: MySqlTableFn) {
	return mysqlTable(
		'LessonProgress',
		{
			id: varchar('id', { length: 191 }).notNull().primaryKey(),
			userId: varchar('userId', { length: 191 }).notNull(),
			lessonId: varchar('lessonId', { length: 191 }),
			lessonSlug: varchar('lessonSlug', { length: 191 }),
			lessonVersion: varchar('lessonVersion', { length: 191 }),
			sectionId: varchar('sectionId', { length: 191 }),
			moduleId: varchar('moduleId', { length: 191 }),
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
					crp.lessonId,
				),
				userIdIdx: index('userId_idx').on(crp.userId),
				lessonIdIdx: index('lessonId_idx').on(crp.lessonId),
			}
		},
	)
}
