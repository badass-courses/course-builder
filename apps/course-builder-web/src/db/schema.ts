import { accounts } from '@/db/schemas/accounts'
import { communicationChannel } from '@/db/schemas/communication-channel'
import { communicationPreferenceTypes } from '@/db/schemas/communication-preference-types'
import { communicationPreferences } from '@/db/schemas/communication-preferences'
import { contentContributions } from '@/db/schemas/content-contributions'
import { contentResource } from '@/db/schemas/content-resource'
import { contentResourceResource } from '@/db/schemas/content-resource-resource'
import { contributionTypes } from '@/db/schemas/contribution-types'
import { permissions } from '@/db/schemas/permissions'
import { rolePermissions } from '@/db/schemas/role-permissions'
import { roles } from '@/db/schemas/roles'
import { sessions } from '@/db/schemas/sessions'
import { userPermissions } from '@/db/schemas/user-permissions'
import { userRoles } from '@/db/schemas/user-roles'
import { users } from '@/db/schemas/users'
import { relations } from 'drizzle-orm'

import { verificationTokens } from './schemas/verification-tokens'

export {
	users,
	permissions,
	roles,
	userRoles,
	userPermissions,
	rolePermissions,
	contentContributions,
	contributionTypes,
	contentResource,
	contentResourceResource,
	communicationPreferenceTypes,
	communicationChannel,
	communicationPreferences,
	accounts,
	sessions,
	verificationTokens,
}

export const usersRelations = relations(users, ({ many }) => ({
	accounts: many(accounts),
	communicationPreferences: many(communicationPreferences),
	userRoles: many(userRoles),
	userPermissions: many(userPermissions),
	contributions: many(contentContributions),
	createdContent: many(contentResource),
}))

export const permissionsRelations = relations(permissions, ({ many }) => ({
	rolePermissions: many(rolePermissions),
}))

export const rolesRelations = relations(roles, ({ many }) => ({
	userRoles: many(userRoles),
}))

export const userRolesRelations = relations(userRoles, ({ one }) => ({
	user: one(users, { fields: [userRoles.userId], references: [users.id] }),
	role: one(roles, { fields: [userRoles.roleId], references: [roles.id] }),
}))

export const userPermissionsRelations = relations(
	userPermissions,
	({ one }) => ({
		user: one(users, {
			fields: [userPermissions.userId],
			references: [users.id],
		}),
		permission: one(permissions, {
			fields: [userPermissions.permissionId],
			references: [permissions.id],
		}),
	}),
)

export const rolePermissionsRelations = relations(
	rolePermissions,
	({ one }) => ({
		role: one(roles, {
			fields: [rolePermissions.roleId],
			references: [roles.id],
		}),
		permission: one(permissions, {
			fields: [rolePermissions.permissionId],
			references: [permissions.id],
		}),
	}),
)

export const contentContributionRelations = relations(
	contentContributions,
	({ one }) => ({
		user: one(users, {
			fields: [contentContributions.userId],
			references: [users.id],
		}),
		content: one(contentResource, {
			fields: [contentContributions.contentId],
			references: [contentResource.id],
		}),
		contributionType: one(contributionTypes, {
			fields: [contentContributions.contributionTypeId],
			references: [contributionTypes.id],
		}),
	}),
)

export const contributionTypesRelations = relations(
	contributionTypes,
	({ many }) => ({
		contributions: many(contentContributions),
	}),
)

export const contentResourceRelations = relations(
	contentResource,
	({ one, many }) => ({
		createdBy: one(users, {
			fields: [contentResource.createdById],
			references: [users.id],
		}),
		contributions: many(contentContributions),
		resources: many(contentResourceResource, { relationName: 'resourceOf' }),
		resourceOf: many(contentResourceResource, { relationName: 'resource' }),
	}),
)

export const contentResourceResourceRelations = relations(
	contentResourceResource,
	({ one }) => ({
		resourceOf: one(contentResource, {
			fields: [contentResourceResource.resourceOfId],
			references: [contentResource.id],
			relationName: 'resourceOf',
		}),
		resource: one(contentResource, {
			fields: [contentResourceResource.resourceId],
			references: [contentResource.id],
			relationName: 'resource',
		}),
	}),
)

export const communicationPreferencesRelations = relations(
	communicationPreferences,
	({ one }) => ({
		user: one(users, {
			fields: [communicationPreferences.userId],
			references: [users.id],
		}),
		channel: one(communicationChannel, {
			fields: [communicationPreferences.channelId],
			references: [communicationChannel.id],
		}),
		preferenceType: one(communicationPreferenceTypes, {
			fields: [communicationPreferences.preferenceTypeId],
			references: [communicationPreferenceTypes.id],
		}),
	}),
)

export const accountsRelations = relations(accounts, ({ one }) => ({
	user: one(users, { fields: [accounts.userId], references: [users.id] }),
}))

export const sessionsRelations = relations(sessions, ({ one }) => ({
	user: one(users, { fields: [sessions.userId], references: [users.id] }),
}))
