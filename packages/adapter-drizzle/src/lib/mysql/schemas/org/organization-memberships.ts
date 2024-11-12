import { relations, sql } from 'drizzle-orm'
import {
	index,
	json,
	mysqlEnum,
	MySqlTableFn,
	timestamp,
	varchar,
} from 'drizzle-orm/mysql-core'

import { getUsersSchema } from '../auth/users.js'

export function getOrganizationMembershipsSchema(mysqlTable: MySqlTableFn) {
	return mysqlTable(
		'OrganizationMembership',
		{
			id: varchar('id', { length: 255 }).notNull().primaryKey(),
			organizationId: varchar('organizationId', { length: 191 }),
			role: varchar('role', { length: 191 }).notNull().default('user'),
			invitedById: varchar('invitedById', { length: 255 }).notNull(),
			userId: varchar('userId', { length: 255 }).notNull(),
			fields: json('fields').$type<Record<string, any>>().default({}),
			createdAt: timestamp('createdAt', {
				mode: 'date',
				fsp: 3,
			}).default(sql`CURRENT_TIMESTAMP(3)`),
		},
		(organizationMembership) => ({
			roleIdx: index('role_idx').on(organizationMembership.role),
			createdAtIdx: index('created_at_idx').on(
				organizationMembership.createdAt,
			),
			organizationIdIdx: index('organizationId_idx').on(
				organizationMembership.organizationId,
			),
		}),
	)
}

export function getUsersRelationsSchema(mysqlTable: MySqlTableFn) {
	const users = getUsersSchema(mysqlTable)

	const organizationMemberships = getOrganizationMembershipsSchema(mysqlTable)

	return relations(organizationMemberships, ({ one, many }) => ({
		user: one(users, {
			fields: [organizationMemberships.userId],
			references: [users.id],
			relationName: 'user',
		}),
		invitedBy: one(users, {
			fields: [organizationMemberships.invitedById],
			references: [users.id],
			relationName: 'invitedBy',
		}),
	}))
}
