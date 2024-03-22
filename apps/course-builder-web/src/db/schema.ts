import { accounts, accountsRelations } from '@/db/schemas/accounts'
import { communicationChannel } from '@/db/schemas/communication-channel'
import { communicationPreferenceTypes } from '@/db/schemas/communication-preference-types'
import {
	communicationPreferences,
	communicationPreferencesRelations,
} from '@/db/schemas/communication-preferences'
import {
	contentContributionRelations,
	contentContributions,
} from '@/db/schemas/content-contributions'
import {
	contentResource,
	contentResourceRelations,
} from '@/db/schemas/content-resource'
import {
	contentResourceResource,
	contentResourceResourceRelations,
} from '@/db/schemas/content-resource-resource'
import {
	contributionTypes,
	contributionTypesRelations,
} from '@/db/schemas/contribution-types'
import { permissions, permissionsRelations } from '@/db/schemas/permissions'
import {
	rolePermissions,
	rolePermissionsRelations,
} from '@/db/schemas/role-permissions'
import { roles, rolesRelations } from '@/db/schemas/roles'
import { sessions, sessionsRelations } from '@/db/schemas/sessions'
import {
	userPermissions,
	userPermissionsRelations,
} from '@/db/schemas/user-permissions'
import { userRoles, userRolesRelations } from '@/db/schemas/user-roles'
import { users, usersRelations } from '@/db/schemas/users'

import { verificationTokens } from './schemas/verification-tokens'

export {
	users,
	usersRelations,
	permissions,
	permissionsRelations,
	roles,
	rolesRelations,
	userRoles,
	userRolesRelations,
	userPermissions,
	userPermissionsRelations,
	rolePermissions,
	rolePermissionsRelations,
	contentContributions,
	contentContributionRelations,
	contributionTypes,
	contributionTypesRelations,
	contentResource,
	contentResourceRelations,
	contentResourceResource,
	contentResourceResourceRelations,
	communicationPreferenceTypes,
	communicationChannel,
	communicationPreferences,
	communicationPreferencesRelations,
	accounts,
	accountsRelations,
	sessions,
	sessionsRelations,
	verificationTokens,
}
