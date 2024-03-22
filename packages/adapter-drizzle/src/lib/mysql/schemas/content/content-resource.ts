import { sql } from 'drizzle-orm'
import {
	index,
	json,
	MySqlTableFn,
	timestamp,
	varchar,
} from 'drizzle-orm/mysql-core'

export const getContentResourceSchema = (mysqlTable: MySqlTableFn) => {
	const contentResource = mysqlTable(
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

	return { contentResource }
}
