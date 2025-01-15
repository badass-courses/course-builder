import { mysqlTable } from '@/db/mysql-table'
import { relations } from 'drizzle-orm'
import { MySqlColumn, varchar, type MySqlTableFn } from 'drizzle-orm/mysql-core'

import { getCourseBuilderSchema } from '@coursebuilder/adapter-drizzle/mysql'

import { invites, organization } from '../schema'

const { organizationRelations, organizationMemberships } =
	getCourseBuilderSchema(mysqlTable)

export function getEggheadOrganizationMembershipsSchema(
	mysqlTable: MySqlTableFn,
) {
	const columns = Object.entries(organizationMemberships).reduce(
		(acc, [key, value]) => {
			if (value instanceof MySqlColumn) {
				acc[key] = value
			}
			return acc
		},
		{} as Record<string, MySqlColumn<any, any>>,
	)

	return mysqlTable('OrganizationMembership', {
		...columns,
		inviteId: varchar('invite_id', { length: 255 }).notNull().unique(),
	})
}

export function getEggheadOrganizationMembershipsRelationsSchema(
	mysqlTable: MySqlTableFn,
) {
	const organizationMembershipsWithInvites =
		getEggheadOrganizationMembershipsSchema(mysqlTable)

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
