import { mysqlTable } from '@/db/mysql-table'
import { users } from '@/db/schemas/auth/users'
import { contentContributions } from '@/db/schemas/content/content-contributions'
import { contentResourceResource } from '@/db/schemas/content/content-resource-resource'
import { relations } from 'drizzle-orm'

import { getContentResourceSchema } from '@coursebuilder/adapter-drizzle/mysql'

export const { contentResource } = getContentResourceSchema(mysqlTable)

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
