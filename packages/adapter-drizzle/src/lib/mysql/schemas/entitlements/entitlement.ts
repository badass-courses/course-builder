import { relations, sql } from 'drizzle-orm'
import {
	index,
	json,
	MySqlTableFn,
	timestamp,
	varchar,
} from 'drizzle-orm/mysql-core'

import { getUsersSchema } from '../auth/users.js'
import { getOrganizationMembershipsSchema } from '../org/organization-memberships.js'
import { getOrganizationsSchema } from '../org/organizations.js'

export function getEntitlementsSchema(mysqlTable: MySqlTableFn) {
	return mysqlTable(
		'Entitlement',
		{
			id: varchar('id', { length: 191 }).notNull().primaryKey(),
			entitlementType: varchar('entitlementType', { length: 255 }).notNull(),
			userId: varchar('userId', { length: 191 }),
			organizationId: varchar('organizationId', { length: 191 }),
			organizationMembershipId: varchar('organizationMembershipId', {
				length: 191,
			}),
			sourceType: varchar('sourceType', { length: 255 }).notNull(), // 'PURCHASE' | 'SUBSCRIPTION' | 'MANUAL' etc
			sourceId: varchar('sourceId', { length: 191 }).notNull(),
			metadata: json('metadata').$type<Record<string, any>>().default({}),
			expiresAt: timestamp('expiresAt', { mode: 'date', fsp: 3 }),
			createdAt: timestamp('createdAt', { mode: 'date', fsp: 3 })
				.default(sql`CURRENT_TIMESTAMP(3)`)
				.notNull(),
			updatedAt: timestamp('updatedAt', { mode: 'date', fsp: 3 })
				.default(sql`CURRENT_TIMESTAMP(3)`)
				.notNull(),
			deletedAt: timestamp('deletedAt', { mode: 'date', fsp: 3 }),
		},
		(table) => ({
			userIdIdx: index('userId_idx').on(table.userId),
			orgIdIdx: index('orgId_idx').on(table.organizationId),
			sourceIdx: index('source_idx').on(table.sourceType, table.sourceId),
			typeIdx: index('type_idx').on(table.entitlementType),
		}),
	)
}

export function getEntitlementRelationsSchema(mysqlTable: MySqlTableFn) {
	const entitlements = getEntitlementsSchema(mysqlTable)
	const users = getUsersSchema(mysqlTable)
	const orgs = getOrganizationsSchema(mysqlTable)
	const memberships = getOrganizationMembershipsSchema(mysqlTable)

	return relations(entitlements, ({ one }) => ({
		user: one(users, {
			fields: [entitlements.userId],
			references: [users.id],
		}),
		organization: one(orgs, {
			fields: [entitlements.organizationId],
			references: [orgs.id],
		}),
		membership: one(memberships, {
			fields: [entitlements.organizationMembershipId],
			references: [memberships.id],
		}),
	}))
}
