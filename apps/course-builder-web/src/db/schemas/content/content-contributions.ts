import { mysqlTable } from '@/db/mysql-table'
import { users } from '@/db/schemas/auth/users'
import { contentResource } from '@/db/schemas/content/content-resource'
import { contributionTypes } from '@/db/schemas/content/contribution-types'
import { relations } from 'drizzle-orm'

import { getContentContributionsSchema } from '@coursebuilder/adapter-drizzle/mysql'

export const { contentContributions } =
	getContentContributionsSchema(mysqlTable)

export const contentContributionRelations = relations(
	contentContributions,
	({ one }) => ({
		user: one(users, {
			fields: [contentContributions.userId],
			references: [users.id],
		}),
		content: one(contentResource, {
			fields: [contentContributions.contentId],
			references: [contentResource.id],
		}),
		contributionType: one(contributionTypes, {
			fields: [contentContributions.contributionTypeId],
			references: [contributionTypes.id],
		}),
	}),
)
