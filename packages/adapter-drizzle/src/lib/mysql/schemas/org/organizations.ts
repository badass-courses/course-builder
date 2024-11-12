import { relations, sql } from 'drizzle-orm'
import {
	index,
	json,
	mysqlEnum,
	MySqlTableFn,
	timestamp,
	varchar,
} from 'drizzle-orm/mysql-core'

import { getPurchaseSchema } from '../commerce/purchase.js'

export function getOrganizationsSchema(mysqlTable: MySqlTableFn) {
	return mysqlTable(
		'Organization',
		{
			id: varchar('id', { length: 255 }).notNull().primaryKey(),
			name: varchar('name', { length: 255 }),
			fields: json('fields').$type<Record<string, any>>().default({}),
			image: varchar('image', { length: 255 }),
			createdAt: timestamp('createdAt', {
				mode: 'date',
				fsp: 3,
			}).default(sql`CURRENT_TIMESTAMP(3)`),
		},
		(organization) => ({
			createdAtIdx: index('created_at_idx').on(organization.createdAt),
		}),
	)
}

export function getOrganizationsRelationsSchema(mysqlTable: MySqlTableFn) {
	const organizations = getOrganizationsSchema(mysqlTable)
	const purchases = getPurchaseSchema(mysqlTable)
	return relations(organizations, ({ many }) => ({
		purchases: many(purchases, {
			relationName: 'organization',
		}),
	}))
}
