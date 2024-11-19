import { relations, sql } from 'drizzle-orm'
import {
	double,
	index,
	MySqlTableFn,
	primaryKey,
	timestamp,
	varchar,
} from 'drizzle-orm/mysql-core'

import { getContentResourceSchema } from './content-resource.js'
import { getTagSchema } from './tag.js'

export function getContentResourceTagSchema(mysqlTable: MySqlTableFn) {
	return mysqlTable(
		'ContentResourceTag',
		{
			contentResourceId: varchar('contentResourceId', {
				length: 255,
			}).notNull(),
			organizationId: varchar('organizationId', { length: 191 }),
			tagId: varchar('tagId', { length: 255 }).notNull(),
			position: double('position').notNull().default(0),
			createdAt: timestamp('createdAt', {
				mode: 'date',
				fsp: 3,
			}).default(sql`CURRENT_TIMESTAMP(3)`),
			updatedAt: timestamp('updatedAt', {
				mode: 'date',
				fsp: 3,
			}).default(sql`CURRENT_TIMESTAMP(3)`),
		},
		(crt) => ({
			pk: primaryKey({ columns: [crt.contentResourceId, crt.tagId] }),
			contentResourceIdIdx: index('contentResourceId_idx').on(
				crt.contentResourceId,
			),
			tagIdIdx: index('tagId_idx').on(crt.tagId),
			positionIdx: index('position_idx').on(crt.position),
			organizationIdIdx: index('organizationId_idx').on(crt.organizationId),
		}),
	)
}

export function getContentResourceTagRelationsSchema(mysqlTable: MySqlTableFn) {
	const contentResource = getContentResourceSchema(mysqlTable)
	const tag = getTagSchema(mysqlTable)
	const contentResourceTag = getContentResourceTagSchema(mysqlTable)
	return relations(contentResourceTag, ({ one }) => ({
		contentResource: one(contentResource, {
			fields: [contentResourceTag.contentResourceId],
			references: [contentResource.id],
			relationName: 'contentResource',
		}),
		tag: one(tag, {
			fields: [contentResourceTag.tagId],
			references: [tag.id],
			relationName: 'tag',
		}),
	}))
}
