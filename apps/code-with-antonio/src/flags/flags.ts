import { dedupe, flag } from '@vercel/flags/next'

import { COMMERCE_ENABLED, FLAGS, SHOW_TEAM_PRICING } from './flag-definitions'
import { redisAdapter } from './flags-adapter'
import { getEnvironment, getEnvKey } from './flags-env'

export type FlagOption<T> = {
	value: T
	label: string
}

export const FLAG_PREFIX = 'flag:'

// Common identify function for all flags
const identify = dedupe(async () => {
	return {
		user: {
			// TODO: Add actual user context from your auth system
			authenticated: false,
		},
	}
})

// Create the flag instances with environment-specific keys
export const commerceEnabled = flag<boolean>({
	key: getEnvKey(FLAGS[COMMERCE_ENABLED].key),
	adapter: redisAdapter(),
	defaultValue: FLAGS[COMMERCE_ENABLED].defaultValue[getEnvironment()],
	identify,
	options: FLAGS[COMMERCE_ENABLED].options,
})

export const showTeamPricingFlag = flag<boolean>({
	key: getEnvKey(FLAGS[SHOW_TEAM_PRICING].key),
	adapter: redisAdapter(),
	defaultValue: FLAGS[SHOW_TEAM_PRICING].defaultValue[getEnvironment()],
	identify,
	options: FLAGS[SHOW_TEAM_PRICING].options,
})

// Map of flag keys to their instances
export const flagInstances = {
	[COMMERCE_ENABLED]: commerceEnabled,
	[SHOW_TEAM_PRICING]: showTeamPricingFlag,
} as const

// Array of flags for precomputation
export const precomputeFlags = Object.values(flagInstances)

// Re-export types and constants
export type { FlagKey } from './flag-definitions'
export { FLAGS } from './flag-definitions'
