import { mysqlTable } from '@/db/mysql-table'
import { relations } from 'drizzle-orm'
import { varchar, type MySqlTableFn } from 'drizzle-orm/mysql-core'

import { getCourseBuilderSchema } from '@coursebuilder/adapter-drizzle/mysql'

import { invites, organization } from '../schema'

const { organizationRelations, organizationMemberships } =
	getCourseBuilderSchema(mysqlTable)

export function getEggheadOrganizationMembershipsSchema(
	mysqlTable: MySqlTableFn,
) {
	const organizationMembershipsWithInvites = mysqlTable(
		'OrganizationMembership',
		{
			inviteId: varchar('invite_id', { length: 255 }).notNull().unique(),
		},
	)

	return { ...organizationMembershipsWithInvites, ...organizationMemberships }
}

export function getEggheadOrganizationMembershipsRelationsSchema(
	mysqlTable: MySqlTableFn,
) {
	const organizationMembershipsWithInvites =
		getEggheadOrganizationMembershipsSchema(mysqlTable)

	const inviteRelation = relations(invites, ({ one }) => ({
		invites: one(invites, {
			fields: [organizationMembershipsWithInvites.inviteId],
			references: [invites.id],
		}),
	}))

	return {
		...organizationRelations,
		...inviteRelation,
	}
}
