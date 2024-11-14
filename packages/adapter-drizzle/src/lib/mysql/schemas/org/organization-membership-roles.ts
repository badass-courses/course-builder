import { relations } from 'drizzle-orm'
import {
	boolean,
	index,
	MySqlTableFn,
	primaryKey,
	timestamp,
	varchar,
} from 'drizzle-orm/mysql-core'

import { getRolesSchema } from '../auth/roles.js'
import { getOrganizationMembershipsSchema } from './organization-memberships.js'

export function getOrganizationMembershipRolesSchema(mysqlTable: MySqlTableFn) {
	return mysqlTable(
		'OrganizationMembershipRole',
		{
			organizationMembershipId: varchar('organizationMembershipId', {
				length: 255,
			}).notNull(),
			roleId: varchar('roleId', { length: 255 }).notNull(),
			active: boolean('active').notNull().default(true),
			organizationId: varchar('organizationId', { length: 191 }),
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
		(ur) => ({
			pk: primaryKey({
				columns: [ur.organizationMembershipId, ur.roleId],
				name: 'pk',
			}),
			orgMemberIdIdx: index('orgMemberId_idx').on(ur.organizationMembershipId),
			roleIdIdx: index('roleId_idx').on(ur.roleId),
			organizationIdIdx: index('organizationId_idx').on(ur.organizationId),
		}),
	)
}

export function getOrganizationMembershipRolesRelationsSchema(
	mysqlTable: MySqlTableFn,
) {
	const organizationMembershipRoles =
		getOrganizationMembershipRolesSchema(mysqlTable)
	const organizationMemberships = getOrganizationMembershipsSchema(mysqlTable)
	const roles = getRolesSchema(mysqlTable)
	return relations(organizationMembershipRoles, ({ one }) => ({
		organizationMembership: one(organizationMemberships, {
			fields: [organizationMembershipRoles.organizationMembershipId],
			references: [organizationMemberships.id],
			relationName: 'organizationMembership',
		}),
		role: one(roles, {
			fields: [organizationMembershipRoles.roleId],
			references: [roles.id],
			relationName: 'role',
		}),
	}))
}
