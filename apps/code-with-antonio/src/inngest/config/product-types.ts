import { env } from '@/env.mjs'
import { getCohort } from '@/lib/cohorts-query'
import {
	createCohortEntitlement,
	createWorkshopEntitlement,
} from '@/lib/entitlements'
import { getWorkshop } from '@/lib/workshops-query'

import {
	USER_ADDED_TO_COHORT_EVENT,
	USER_ADDED_TO_WORKSHOP_EVENT,
} from '../functions/discord/add-discord-role-workflow'

/**
 * Shared product type configuration used across all workflows
 * This eliminates duplication between post-purchase, transfer, and other workflows
 */
export const PRODUCT_TYPE_CONFIG = {
	cohort: {
		resourceType: 'cohort',
		queryFn: getCohort,
		contentAccess: 'cohort_content_access',
		discordRole: 'cohort_discord_role',
		createEntitlement: createCohortEntitlement,
		discordEvent: USER_ADDED_TO_COHORT_EVENT,
		logPrefix: 'cohort',
		getDiscordRoleId: (product: any) =>
			product?.fields?.discordRoleId || env.DISCORD_COHORT_001_ROLE_ID,
	},
	'self-paced': {
		resourceType: 'workshop',
		queryFn: getWorkshop,
		contentAccess: 'workshop_content_access',
		discordRole: 'workshop_discord_role',
		createEntitlement: createWorkshopEntitlement,
		discordEvent: USER_ADDED_TO_WORKSHOP_EVENT,
		logPrefix: 'workshop',
		getDiscordRoleId: (product: any) =>
			product?.fields?.discordRoleId || env.DISCORD_PURCHASER_ROLE_ID,
	},
} as const

// Entitlement config for backwards compatibility
export const ENTITLEMENT_CONFIG = {
	cohort: {
		contentAccess: PRODUCT_TYPE_CONFIG.cohort.contentAccess,
		discordRole: PRODUCT_TYPE_CONFIG.cohort.discordRole,
		createEntitlement: PRODUCT_TYPE_CONFIG.cohort.createEntitlement,
		discordEvent: PRODUCT_TYPE_CONFIG.cohort.discordEvent,
		logPrefix: PRODUCT_TYPE_CONFIG.cohort.logPrefix,
	},
	'self-paced': {
		contentAccess: PRODUCT_TYPE_CONFIG['self-paced'].contentAccess,
		discordRole: PRODUCT_TYPE_CONFIG['self-paced'].discordRole,
		createEntitlement: PRODUCT_TYPE_CONFIG['self-paced'].createEntitlement,
		discordEvent: PRODUCT_TYPE_CONFIG['self-paced'].discordEvent,
		logPrefix: PRODUCT_TYPE_CONFIG['self-paced'].logPrefix,
	},
} as const

export type ProductType = keyof typeof PRODUCT_TYPE_CONFIG

/**
 * Get resource data based on product type.
 */
export const getResourceData = async (
	resourceId: string,
	productType: ProductType,
) => {
	const config = PRODUCT_TYPE_CONFIG[productType]
	if (!config) {
		throw new Error(`Unsupported product type: ${productType}`)
	}
	// Membership products don't have associated resources
	if (!config.queryFn) {
		return null
	}
	return await config.queryFn(resourceId)
}

/**
 * Get Discord role ID for a product type with fallback
 */
export const getDiscordRoleId = (productType: ProductType, product: any) => {
	const config = PRODUCT_TYPE_CONFIG[productType]
	return config.getDiscordRoleId(product)
}
