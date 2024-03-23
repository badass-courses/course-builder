import { mysqlTable } from '@/db/mysql-table'

import {
	getAccountsRelationsSchema,
	getAccountsSchema,
	getCommunicationChannelSchema,
	getCommunicationPreferencesRelationsSchema,
	getCommunicationPreferencesSchema,
	getCommunicationPreferenceTypesSchema,
	getContentContributionRelationsSchema,
	getContentContributionsSchema,
	getContentResourceRelationsSchema,
	getContentResourceResourceRelationsSchema,
	getContentResourceResourceSchema,
	getContentResourceSchema,
	getContributionTypesRelationsSchema,
	getContributionTypesSchema,
	getCouponSchema,
	getMerchantAccountSchema,
	getMerchantChargeSchema,
	getMerchantCouponSchema,
	getMerchantCustomerSchema,
	getMerchantPriceSchema,
	getMerchantProductSchema,
	getMerchantSessionSchema,
	getPermissionsRelationsSchema,
	getPermissionsSchema,
	getPriceSchema,
	getProductSchema,
	getPurchaseSchema,
	getPurchaseUserTransferSchema,
	getResourceProgressSchema,
	getRolePermissionsRelationsSchema,
	getRolePermissionsSchema,
	getRolesRelationsSchema,
	getRolesSchema,
	getSessionRelationsSchema,
	getSessionsSchema,
	getUserPermissionsRelationsSchema,
	getUserPermissionsSchema,
	getUserRolesRelationsSchema,
	getUserRolesSchema,
	getUsersRelationsSchema,
	getUsersSchema,
	getVerificationTokensSchema,
} from '@coursebuilder/adapter-drizzle/mysql'

export const accounts = getAccountsSchema(mysqlTable)

export const accountsRelations = getAccountsRelationsSchema(mysqlTable)
export const permissions = getPermissionsSchema(mysqlTable)
export const permissionsRelations = getPermissionsRelationsSchema(mysqlTable)
export const rolePermissions = getRolePermissionsSchema(mysqlTable)
export const rolePermissionsRelations =
	getRolePermissionsRelationsSchema(mysqlTable)
export const roles = getRolesSchema(mysqlTable)
export const rolesRelations = getRolesRelationsSchema(mysqlTable)
export const sessions = getSessionsSchema(mysqlTable)
export const sessionsRelations = getSessionRelationsSchema(mysqlTable)
export const userPermissions = getUserPermissionsSchema(mysqlTable)
export const userPermissionsRelations =
	getUserPermissionsRelationsSchema(mysqlTable)
export const userRoles = getUserRolesSchema(mysqlTable)
export const userRolesRelations = getUserRolesRelationsSchema(mysqlTable)
export const users = getUsersSchema(mysqlTable)
export const usersRelations = getUsersRelationsSchema(mysqlTable)
export const verificationTokens = getVerificationTokensSchema(mysqlTable)
export const coupon = getCouponSchema(mysqlTable)
export const merchantAccount = getMerchantAccountSchema(mysqlTable)
export const merchantCharge = getMerchantChargeSchema(mysqlTable)
export const merchantCoupon = getMerchantCouponSchema(mysqlTable)
export const merchantCustomer = getMerchantCustomerSchema(mysqlTable)
export const merchantPrice = getMerchantPriceSchema(mysqlTable)
export const merchantProduct = getMerchantProductSchema(mysqlTable)
export const merchantSession = getMerchantSessionSchema(mysqlTable)
export const price = getPriceSchema(mysqlTable)
export const product = getProductSchema(mysqlTable)
export const purchase = getPurchaseSchema(mysqlTable)
export const purchaseUserTransfer = getPurchaseUserTransferSchema(mysqlTable)
export const communicationChannel = getCommunicationChannelSchema(mysqlTable)
export const communicationPreferenceTypes =
	getCommunicationPreferenceTypesSchema(mysqlTable)
export const communicationPreferences =
	getCommunicationPreferencesSchema(mysqlTable)
export const communicationPreferencesRelations =
	getCommunicationPreferencesRelationsSchema(mysqlTable)
export const contentContributions = getContentContributionsSchema(mysqlTable)
export const contentContributionRelations =
	getContentContributionRelationsSchema(mysqlTable)
export const contentResource = getContentResourceSchema(mysqlTable)
export const contentResourceRelations =
	getContentResourceRelationsSchema(mysqlTable)
export const contentResourceResource =
	getContentResourceResourceSchema(mysqlTable)
export const contentResourceResourceRelations =
	getContentResourceResourceRelationsSchema(mysqlTable)
export const contributionTypes = getContributionTypesSchema(mysqlTable)
export const contributionTypesRelations =
	getContributionTypesRelationsSchema(mysqlTable)
export const resourceProgress = getResourceProgressSchema(mysqlTable)
