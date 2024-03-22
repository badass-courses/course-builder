import { mysqlTable } from '@/db/mysql-table'
import { contentResource } from '@/db/schemas/content/content-resource'
import { relations } from 'drizzle-orm'

import { getContentResourceResourceSchema } from '@coursebuilder/adapter-drizzle/mysql'

export const { contentResourceResource } =
	getContentResourceResourceSchema(mysqlTable)

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
