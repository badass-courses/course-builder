import { mysqlTable } from '@/db/mysql-table'
import { users } from '@/db/schemas/auth/users'
import { contentResource } from '@/db/schemas/content/content-resource'
import { contributionTypes } from '@/db/schemas/content/contribution-types'
import { relations } from 'drizzle-orm'
import { boolean, index, timestamp, varchar } from 'drizzle-orm/mysql-core'

export const contentContributions = mysqlTable(
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
