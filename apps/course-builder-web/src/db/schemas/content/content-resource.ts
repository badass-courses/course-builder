import { mysqlTable } from '@/db/mysql-table'
import { users } from '@/db/schemas/auth/users'
import { contentContributions } from '@/db/schemas/content/content-contributions'
import { contentResourceResource } from '@/db/schemas/content/content-resource-resource'
import { relations, sql } from 'drizzle-orm'
import { index, json, timestamp, varchar } from 'drizzle-orm/mysql-core'

export const contentResource = mysqlTable(
	'contentResource',
	{
		id: varchar('id', { length: 255 }).notNull().primaryKey(),
		type: varchar('type', { length: 255 }).notNull(),
		createdById: varchar('createdById', { length: 255 }).notNull(),
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
	(cm) => ({
		typeIdx: index('type_idx').on(cm.type),
		createdByIdx: index('createdById_idx').on(cm.createdById),
		createdAtIdx: index('createdAt_idx').on(cm.createdAt),
	}),
)

export const contentResourceRelations = relations(
	contentResource,
	({ one, many }) => ({
		createdBy: one(users, {
			fields: [contentResource.createdById],
			references: [users.id],
		}),
		contributions: many(contentContributions),
		resources: many(contentResourceResource, { relationName: 'resourceOf' }),
		resourceOf: many(contentResourceResource, { relationName: 'resource' }),
	}),
)
