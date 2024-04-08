import { relations, sql } from 'drizzle-orm'
import {
	index,
	json,
	MySqlTableFn,
	timestamp,
	varchar,
} from 'drizzle-orm/mysql-core'

import { getUsersSchema } from '../auth/users.js'
import { getContentContributionsSchema } from './content-contributions.js'
import { getContentResourceProductSchema } from './content-resource-product.js'
import { getContentResourceResourceSchema } from './content-resource-resource.js'

export function getContentResourceSchema(mysqlTable: MySqlTableFn) {
	return mysqlTable(
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
}

export function getContentResourceRelationsSchema(mysqlTable: MySqlTableFn) {
	const contentResource = getContentResourceSchema(mysqlTable)
	const users = getUsersSchema(mysqlTable)
	const contentResourceResource = getContentResourceResourceSchema(mysqlTable)
	const contentResourceProduct = getContentResourceProductSchema(mysqlTable)
	return relations(contentResource, ({ one, many }) => ({
		createdBy: one(users, {
			fields: [contentResource.createdById],
			references: [users.id],
			relationName: 'user',
		}),
		resources: many(contentResourceResource, { relationName: 'resourceOf' }),
		resourceOf: many(contentResourceResource, { relationName: 'resource' }),
		resourceProducts: many(contentResourceProduct, {
			relationName: 'resource',
		}),
	}))
}
