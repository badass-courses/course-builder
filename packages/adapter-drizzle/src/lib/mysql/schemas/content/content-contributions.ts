import { relations } from 'drizzle-orm'
import {
	boolean,
	index,
	MySqlTableFn,
	timestamp,
	varchar,
} from 'drizzle-orm/mysql-core'

import { getUsersSchema } from '../auth/users.js'
import { getContentResourceSchema } from './content-resource.js'
import { getContributionTypesSchema } from './contribution-types.js'

export function getContentContributionsSchema(mysqlTable: MySqlTableFn) {
	return mysqlTable(
		'contentContribution',
		{
			id: varchar('id', { length: 255 }).notNull().primaryKey(),
			userId: varchar('userId', { length: 255 }).notNull(),
			contentId: varchar('contentId', { length: 255 }).notNull(),
			contributionTypeId: varchar('contributionTypeId', {
				length: 255,
			}).notNull(),
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
		(cc) => ({
			userIdIdx: index('userId_idx').on(cc.userId),
			contentIdIdx: index('contentId_idx').on(cc.contentId),
			contributionTypeIdIdx: index('contributionTypeId_idx').on(
				cc.contributionTypeId,
			),
		}),
	)
}

export function getContentContributionRelationsSchema(
	mysqlTable: MySqlTableFn,
) {
	const contentContributions = getContentContributionsSchema(mysqlTable)
	const users = getUsersSchema(mysqlTable)
	const contentResource = getContentResourceSchema(mysqlTable)
	const contributionTypes = getContributionTypesSchema(mysqlTable)

	return relations(contentContributions, ({ one }) => ({
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
	}))
}
