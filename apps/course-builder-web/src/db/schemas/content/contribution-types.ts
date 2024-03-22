import { mysqlTable } from '@/db/mysql-table'
import { contentContributions } from '@/db/schemas/content/content-contributions'
import { relations } from 'drizzle-orm'

import { getContributionTypesSchema } from '@coursebuilder/adapter-drizzle/mysql'

export const { contributionTypes } = getContributionTypesSchema(mysqlTable)

export const contributionTypesRelations = relations(
	contributionTypes,
	({ many }) => ({
		contributions: many(contentContributions),
	}),
)
