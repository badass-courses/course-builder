import { accounts, accountsRelations } from '@/db/schemas/auth/accounts'
import {
	permissions,
	permissionsRelations,
} from '@/db/schemas/auth/permissions'
import {
	rolePermissions,
	rolePermissionsRelations,
} from '@/db/schemas/auth/role-permissions'
import { roles, rolesRelations } from '@/db/schemas/auth/roles'
import { sessions, sessionsRelations } from '@/db/schemas/auth/sessions'
import {
	userPermissions,
	userPermissionsRelations,
} from '@/db/schemas/auth/user-permissions'
import { userRoles, userRolesRelations } from '@/db/schemas/auth/user-roles'
import { users, usersRelations } from '@/db/schemas/auth/users'
import { verificationTokens } from '@/db/schemas/auth/verification-tokens'
import { coupon } from '@/db/schemas/commerce/coupon'
import { merchantAccount } from '@/db/schemas/commerce/merchant-account'
import { merchantCharge } from '@/db/schemas/commerce/merchant-charge'
import { merchantCustomer } from '@/db/schemas/commerce/merchant-customer'
import { merchantPrice } from '@/db/schemas/commerce/merchant-price'
import { merchantProduct } from '@/db/schemas/commerce/merchant-product'
import { merchantSession } from '@/db/schemas/commerce/merchant-session'
import { price } from '@/db/schemas/commerce/price'
import { product } from '@/db/schemas/commerce/product'
import { purchase } from '@/db/schemas/commerce/purchase'
import { purchaseUserTransfer } from '@/db/schemas/commerce/purchase-user-transfer'
import { communicationChannel } from '@/db/schemas/communication/communication-channel'
import { communicationPreferenceTypes } from '@/db/schemas/communication/communication-preference-types'
import {
	communicationPreferences,
	communicationPreferencesRelations,
} from '@/db/schemas/communication/communication-preferences'
import {
	contentContributionRelations,
	contentContributions,
} from '@/db/schemas/content/content-contributions'
import {
	contentResource,
	contentResourceRelations,
} from '@/db/schemas/content/content-resource'
import {
	contentResourceResource,
	contentResourceResourceRelations,
} from '@/db/schemas/content/content-resource-resource'
import {
	contributionTypes,
	contributionTypesRelations,
} from '@/db/schemas/content/contribution-types'
import { resourceProgress } from '@/db/schemas/content/resource-progress'

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
	resourceProgress,
	coupon,
	merchantAccount,
	merchantCharge,
	merchantCustomer,
	merchantPrice,
	merchantProduct,
	merchantSession,
	price,
	product,
	purchase,
	purchaseUserTransfer,
}
