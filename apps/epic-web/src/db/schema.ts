import { mysqlTable } from '@/db/mysql-table'

import { getCourseBuilderSchema } from '@coursebuilder/adapter-drizzle/mysql'

export const {
	accounts,
	accountsRelations,
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
	coupon,
	couponRelations,
	merchantAccount,
	merchantCharge,
	merchantChargeRelations,
	merchantCoupon,
	merchantCustomer,
	merchantPrice,
	merchantProduct,
	merchantSession,
	prices,
	products,
	productRelations,
	purchases,
	purchaseRelations,
	purchaseUserTransfer,
	purchaseUserTransferRelations,
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
	contentResourceProduct,
	contentResourceProductRelations,
	upgradableProducts,
	upgradableProductsRelations,
	comments,
	commentsRelations,
	deviceVerifications,
	deviceVerificationRelations,
	deviceAccessToken,
	deviceAccessTokenRelations,
	userPrefs,
	userPrefsRelations,
	lessonProgress,
	organization,
	organizationRelations,
	organizationMemberships,
	organizationMembershipRelations,
	organizationMembershipRoles,
	organizationMembershipRolesRelations,
} = getCourseBuilderSchema(mysqlTable)
