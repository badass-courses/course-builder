import { mysqlTable } from '@/db/mysql-table'
import {
	getInvitesRelationsSchema,
	getInvitesSchema,
} from '@/db/schemas/invites'
import {
	getEggheadOrganizationMembershipsRelationsSchema,
	getOrganizationMembershipsSchema,
} from '@/db/schemas/organization-membership'

import { getCourseBuilderSchema } from '@coursebuilder/adapter-drizzle/mysql'

export const invites = getInvitesSchema(mysqlTable)
export const invitesRelations = getInvitesRelationsSchema(mysqlTable)

export const organizationMemberships =
	getOrganizationMembershipsSchema(mysqlTable)
export const organizationMembershipsRelations =
	getEggheadOrganizationMembershipsRelationsSchema(mysqlTable)

export const {
	accounts,
	accountsRelations,
	profiles,
	profilesRelations,
	permissions,
	permissionsRelations,
	rolePermissions,
	rolePermissionsRelations,
	roles,
	rolesRelations,
	sessions,
	sessionsRelations,
	userPermissions,
	userPermissionsRelations,
	userRoles,
	userRolesRelations,
	users,
	usersRelations,
	verificationTokens,
	communicationChannel,
	communicationPreferenceTypes,
	communicationPreferences,
	communicationPreferencesRelations,
	contentContributions,
	contentContributionRelations,
	contentResource,
	contentResourceRelations,
	contentResourceVersion,
	contentResourceVersionRelations,
	contentResourceResource,
	contentResourceResourceRelations,
	contributionTypes,
	contributionTypesRelations,
	resourceProgress,
	contentResourceTag,
	contentResourceTagRelations,
	tag,
	tagRelations,
	tagTag,
	tagTagRelations,
	deviceVerifications,
	deviceVerificationRelations,
	deviceAccessToken,
	deviceAccessTokenRelations,
	organization,
	organizationMembershipRelations,
	organizationMembershipRoles,
	organizationMembershipRolesRelations,
} = getCourseBuilderSchema(mysqlTable)
