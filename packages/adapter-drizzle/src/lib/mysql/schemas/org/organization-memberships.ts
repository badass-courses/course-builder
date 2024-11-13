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
import { getPurchaseSchema } from '../commerce/purchase.js'
import { getOrganizationsSchema } from './organizations.js'

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

export function getOrganizationMembershipsRelationsSchema(
	mysqlTable: MySqlTableFn,
) {
	const users = getUsersSchema(mysqlTable)

	const organizationMemberships = getOrganizationMembershipsSchema(mysqlTable)
	const purchases = getPurchaseSchema(mysqlTable)
	const organizations = getOrganizationsSchema(mysqlTable)

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
		purchases: many(purchases),
		organization: one(organizations, {
			fields: [organizationMemberships.organizationId],
			references: [organizations.id],
			relationName: 'organization',
		}),
	}))
}
