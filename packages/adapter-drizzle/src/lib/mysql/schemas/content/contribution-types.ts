import { relations } from 'drizzle-orm'
import {
	boolean,
	index,
	MySqlTableFn,
	text,
	timestamp,
	varchar,
} from 'drizzle-orm/mysql-core'

import { getContentContributionsSchema } from './content-contributions.js'

export function getContributionTypesSchema(mysqlTable: MySqlTableFn) {
	return mysqlTable(
		'contributionType',
		{
			id: varchar('id', { length: 255 }).notNull().primaryKey(),
			slug: varchar('slug', { length: 255 }).notNull().unique(),
			name: varchar('name', { length: 255 }).notNull(),
			description: text('description'),
			active: boolean('active').notNull().default(true),
			createdAt: timestamp('createdAt', {
				mode: 'date',
				fsp: 3,
			}).defaultNow(),
			updatedAt: timestamp('updatedAt', {
				mode: 'date',
				fsp: 3,
			}).defaultNow(),
			deletedAt: timestamp('deletedAt', {
				mode: 'date',
				fsp: 3,
			}),
		},
		(ct) => ({
			nameIdx: index('name_idx').on(ct.name),
			slugIdx: index('slug_idx').on(ct.slug),
		}),
	)
}

export function getContributionTypesRelationsSchema(mysqlTable: MySqlTableFn) {
	const contributionTypes = getContributionTypesSchema(mysqlTable)
	const contentContributions = getContentContributionsSchema(mysqlTable)

	return relations(contributionTypes, ({ many }) => ({
		contributions: many(contentContributions),
	}))
}
