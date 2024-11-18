import { relations, sql } from 'drizzle-orm'
import {
	index,
	int,
	json,
	MySqlTableFn,
	timestamp,
	unique,
	varchar,
} from 'drizzle-orm/mysql-core'

import { getUsersSchema } from '../auth/users.js'
import { getContentResourceSchema } from './content-resource.js'

export function getContentResourceVersionSchema(mysqlTable: MySqlTableFn) {
	return mysqlTable(
		'ContentResourceVersion',
		{
			id: varchar('id', { length: 255 }).notNull().primaryKey(),
			organizationId: varchar('organizationId', { length: 191 }),
			resourceId: varchar('resourceId', { length: 255 }).notNull(),
			parentVersionId: varchar('parentVersionId', { length: 255 }),
			versionNumber: int('versionNumber').notNull(),
			fields: json('fields').$type<Record<string, any>>().default({}),
			createdAt: timestamp('createdAt', {
				mode: 'date',
				fsp: 3,
			}).default(sql`CURRENT_TIMESTAMP(3)`),
			createdById: varchar('createdById', { length: 255 }).notNull(),
		},
		(crv) => ({
			resourceIdIdx: index('resourceId_idx').on(crv.resourceId),
			parentVersionIdIdx: index('parentVersionId_idx').on(crv.parentVersionId),
			resourceIdVersionNumberIdx: index('resourceId_versionNumber_idx').on(
				crv.resourceId,
				crv.versionNumber,
			),
			uniqueResourceVersion: unique('uq_resource_version_number').on(
				crv.resourceId,
				crv.versionNumber,
			),
			organizationIdIdx: index('organizationId_idx').on(crv.organizationId),
		}),
	)
}

export function getContentResourceVersionRelationsSchema(
	mysqlTable: MySqlTableFn,
) {
	const contentResourceVersion = getContentResourceVersionSchema(mysqlTable)
	const contentResource = getContentResourceSchema(mysqlTable)
	const users = getUsersSchema(mysqlTable)

	return relations(contentResourceVersion, ({ one }) => ({
		resource: one(contentResource, {
			fields: [contentResourceVersion.resourceId],
			references: [contentResource.id],
			relationName: 'versions',
		}),
		parentVersion: one(contentResourceVersion, {
			fields: [contentResourceVersion.parentVersionId],
			references: [contentResourceVersion.id],
			relationName: 'childVersions',
		}),
		createdBy: one(users, {
			fields: [contentResourceVersion.createdById],
			references: [users.id],
			relationName: 'createdVersions',
		}),
	}))
}
