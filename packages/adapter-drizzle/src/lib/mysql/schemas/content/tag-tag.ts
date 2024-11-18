import { relations, sql } from 'drizzle-orm'
import {
	double,
	index,
	json,
	MySqlTableFn,
	primaryKey,
	timestamp,
	varchar,
} from 'drizzle-orm/mysql-core'

import { getTagSchema } from './tag.js'

export function getTagTagSchema(mysqlTable: MySqlTableFn) {
	return mysqlTable(
		'TagTag',
		{
			parentTagId: varchar('parentTagId', { length: 255 }).notNull(),
			childTagId: varchar('childTagId', { length: 255 }).notNull(),
			position: double('position').notNull().default(0),
			metadata: json('metadata').$type<Record<string, any>>().default({}),
			organizationId: varchar('organizationId', { length: 191 }),
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
		(tt) => ({
			pk: primaryKey({ columns: [tt.parentTagId, tt.childTagId] }),
			parentTagIdIdx: index('parentTagId_idx').on(tt.parentTagId),
			childTagIdIdx: index('childTagId_idx').on(tt.childTagId),
			positionIdx: index('position_idx').on(tt.position),
			organizationIdIdx: index('organizationId_idx').on(tt.organizationId),
		}),
	)
}

export function getTagTagRelationsSchema(mysqlTable: MySqlTableFn) {
	const tag = getTagSchema(mysqlTable)
	const tagTag = getTagTagSchema(mysqlTable)
	return relations(tagTag, ({ one }) => ({
		parentTag: one(tag, {
			fields: [tagTag.parentTagId],
			references: [tag.id],
			relationName: 'parentTag',
		}),
		childTag: one(tag, {
			fields: [tagTag.childTagId],
			references: [tag.id],
			relationName: 'childTag',
		}),
	}))
}
