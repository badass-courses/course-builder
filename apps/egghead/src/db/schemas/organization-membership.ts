import { mysqlTable } from '@/db/mysql-table'
import { relations, sql } from 'drizzle-orm'
import {
	index,
	json,
	timestamp,
	varchar,
	type MySqlTableFn,
} from 'drizzle-orm/mysql-core'

import { getCourseBuilderSchema } from '@coursebuilder/adapter-drizzle/mysql'

import { invites } from '../schema'

const { organizationRelations } = getCourseBuilderSchema(mysqlTable)

export function getOrganizationMembershipsSchema(mysqlTable: MySqlTableFn) {
	return mysqlTable(
		'OrganizationMembership',
		{
			id: varchar('id', { length: 255 }).notNull().primaryKey(),
			organizationId: varchar('organizationId', { length: 191 }),
			role: varchar('role', { length: 191 }).notNull().default('user'),
			invitedById: varchar('invitedById', { length: 255 }).notNull(),
			userId: varchar('userId', { length: 255 }).notNull(),
			inviteId: varchar('inviteId', { length: 255 }),
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

export function getEggheadOrganizationMembershipsRelationsSchema(
	mysqlTable: MySqlTableFn,
) {
	const organizationMembershipsWithInvites =
		getOrganizationMembershipsSchema(mysqlTable)

	const membershipRelations = relations(
		organizationMembershipsWithInvites,
		({ one }) => ({
			invite: one(invites, {
				fields: [organizationMembershipsWithInvites.inviteId],
				references: [invites.id],
			}),
		}),
	)

	return {
		...organizationRelations,
		organizationMemberships: membershipRelations,
	}
}
