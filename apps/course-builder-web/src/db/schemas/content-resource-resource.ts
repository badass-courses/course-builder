import { mysqlTable } from '@/db/mysql-table'
import { contentResource } from '@/db/schemas/content-resource'
import { relations, sql } from 'drizzle-orm'
import {
	double,
	index,
	json,
	primaryKey,
	timestamp,
	varchar,
} from 'drizzle-orm/mysql-core'

export const contentResourceResource = mysqlTable(
	'contentResourceResource',
	{
		resourceOfId: varchar('resourceOfId', { length: 255 }).notNull(),
		resourceId: varchar('resourceId', { length: 255 }).notNull(),
		position: double('position').notNull().default(0),
		metadata: json('fields').$type<Record<string, any>>().default({}),
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
	(crr) => ({
		pk: primaryKey({ columns: [crr.resourceOfId, crr.resourceId] }),
		contentResourceIdIdx: index('contentResourceId_idx').on(crr.resourceOfId),
		resourceIdIdx: index('resourceId_idx').on(crr.resourceId),
	}),
)

export const contentResourceResourceRelations = relations(
	contentResourceResource,
	({ one }) => ({
		resourceOf: one(contentResource, {
			fields: [contentResourceResource.resourceOfId],
			references: [contentResource.id],
			relationName: 'resourceOf',
		}),
		resource: one(contentResource, {
			fields: [contentResourceResource.resourceId],
			references: [contentResource.id],
			relationName: 'resource',
		}),
	}),
)
