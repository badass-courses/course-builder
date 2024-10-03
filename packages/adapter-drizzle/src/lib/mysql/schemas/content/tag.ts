import { relations, sql } from 'drizzle-orm'
import {
	index,
	json,
	MySqlTableFn,
	timestamp,
	varchar,
} from 'drizzle-orm/mysql-core'

import { getContentResourceTagSchema } from './content-resource-tag.js'
import { getTagTagSchema } from './tag-tag.js'

export function getTagSchema(mysqlTable: MySqlTableFn) {
	return mysqlTable(
		'Tag',
		{
			id: varchar('id', { length: 255 }).notNull().primaryKey(),
			type: varchar('type', { length: 255 }).notNull(),
			fields: json('fields').$type<Record<string, any>>().default({}),
			createdAt: timestamp('createdAt', {
				mode: 'date',
				fsp: 3,
			}).default(sql`CURRENT_TIMESTAMP(3)`),
			updatedAt: timestamp('updatedAt', {
				mode: 'date',
				fsp: 3,
			}).default(sql`CURRENT_TIMESTAMP(3)`),
			deletedAt: timestamp('deletedAt', {
				mode: 'date',
				fsp: 3,
			}),
		},
		(t) => ({
			typeIdx: index('type_idx').on(t.type),
		}),
	)
}

export function getTagRelationsSchema(mysqlTable: MySqlTableFn) {
	const tag = getTagSchema(mysqlTable)
	const contentResourceTag = getContentResourceTagSchema(mysqlTable)
	const tagTag = getTagTagSchema(mysqlTable)
	return relations(tag, ({ many }) => ({
		contentResources: many(contentResourceTag),
		parentTags: many(tagTag, { relationName: 'childTag' }),
		childTags: many(tagTag, { relationName: 'parentTag' }),
	}))
}
