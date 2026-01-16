import { relations, sql } from 'drizzle-orm'
import {
	index,
	MySqlTableFn,
	primaryKey,
	timestamp,
	varchar,
} from 'drizzle-orm/mysql-core'

import { getUsersSchema } from '../auth/users.js'
import { getContentResourceSchema } from './content-resource.js'

/**
 * Join table linking ContentResources to Users as authors.
 * This is a one-to-one relationship (one author per resource).
 * Authors are users with the "author" role.
 */
export function getContentResourceAuthorSchema(mysqlTable: MySqlTableFn) {
	return mysqlTable(
		'ContentResourceAuthor',
		{
			contentResourceId: varchar('contentResourceId', {
				length: 255,
			}).notNull(),
			organizationId: varchar('organizationId', { length: 191 }),
			userId: varchar('userId', { length: 255 }).notNull(),
			createdAt: timestamp('createdAt', {
				mode: 'date',
				fsp: 3,
			}).default(sql`CURRENT_TIMESTAMP(3)`),
			updatedAt: timestamp('updatedAt', {
				mode: 'date',
				fsp: 3,
			}).default(sql`CURRENT_TIMESTAMP(3)`),
		},
		(cra) => ({
			pk: primaryKey({ columns: [cra.contentResourceId, cra.userId] }),
			contentResourceIdIdx: index('contentResourceId_idx').on(
				cra.contentResourceId,
			),
			userIdIdx: index('userId_idx').on(cra.userId),
			organizationIdIdx: index('organizationId_idx').on(cra.organizationId),
		}),
	)
}

export function getContentResourceAuthorRelationsSchema(
	mysqlTable: MySqlTableFn,
) {
	const contentResource = getContentResourceSchema(mysqlTable)
	const users = getUsersSchema(mysqlTable)
	const contentResourceAuthor = getContentResourceAuthorSchema(mysqlTable)
	return relations(contentResourceAuthor, ({ one }) => ({
		contentResource: one(contentResource, {
			fields: [contentResourceAuthor.contentResourceId],
			references: [contentResource.id],
			relationName: 'contentResource',
		}),
		user: one(users, {
			fields: [contentResourceAuthor.userId],
			references: [users.id],
			relationName: 'author',
		}),
	}))
}
