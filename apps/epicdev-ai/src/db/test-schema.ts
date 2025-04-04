import { sqliteTable, text } from 'drizzle-orm/sqlite-core'

export const testPosts = sqliteTable('posts', {
	id: text('id').primaryKey(),
	title: text('title').notNull(),
	state: text('state').notNull().default('draft'),
	visibility: text('visibility').notNull().default('public'),
	postType: text('post_type').notNull(),
	createdById: text('created_by_id').notNull(),
	createdAt: text('created_at').notNull(),
	updatedAt: text('updated_at').notNull(),
	deletedAt: text('deleted_at'),
	parentLessonId: text('parent_lesson_id'),
})
