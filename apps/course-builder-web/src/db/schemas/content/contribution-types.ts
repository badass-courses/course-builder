import { mysqlTable } from '@/db/mysql-table'
import { contentContributions } from '@/db/schemas/content/content-contributions'
import { relations } from 'drizzle-orm'
import {
	boolean,
	index,
	text,
	timestamp,
	varchar,
} from 'drizzle-orm/mysql-core'

export const contributionTypes = mysqlTable(
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

export const contributionTypesRelations = relations(
	contributionTypes,
	({ many }) => ({
		contributions: many(contentContributions),
	}),
)
