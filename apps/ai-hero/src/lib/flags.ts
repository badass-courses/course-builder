import { dedupe, flag } from '@vercel/flags/next'

import { redisAdapter } from './flags-adapter'

export type FlagOption<T> = {
	value: T
	label: string
}

export type Environment = 'production' | 'preview' | 'development' | 'test'

const isValidEnvironment = (env: string): env is Environment => {
	return ['production', 'preview', 'development', 'test'].includes(env)
}

// Common identify function for all flags
const identify = dedupe(async () => {
	return {
		user: {
			// TODO: Add actual user context from your auth system
			authenticated: false,
		},
	}
})

type FlagConfig = {
	key: string
	name: string
	description: string
	defaultValue: Record<Environment, boolean>
	options: FlagOption<boolean>[]
}

const COMMERCE_ENABLED = 'commerce-enabled'
const SHOW_TEAM_PRICING = 'show-team-pricing'

// Helper to get current environment
export const getEnvironment = (): Environment => {
	// Handle test environment
	if (process.env.NODE_ENV === 'test') {
		return 'test'
	}

	// Use NODE_ENV for local development
	if (process.env.NODE_ENV === 'development') {
		return 'development'
	}

	// Use VERCEL_ENV for deployed environments
	const env = process.env.VERCEL_ENV || 'production'

	if (!isValidEnvironment(env)) {
		console.warn(`Invalid environment: ${env}, defaulting to production`)
		return 'production'
	}

	return env
}

// Helper to get environment-specific key
export const getEnvKey = (key: string): string => {
	const env = getEnvironment()
	return `${env}:${key}`
}

export const FLAGS: Record<
	typeof COMMERCE_ENABLED | typeof SHOW_TEAM_PRICING,
	FlagConfig
> = {
	[COMMERCE_ENABLED]: {
		key: COMMERCE_ENABLED,
		name: 'Commerce Enabled',
		description: 'Controls whether commerce features are enabled.',
		defaultValue: {
			production: false, // Disabled by default in prod
			preview: false, // Disabled in preview for safety
			development: true, // Enabled in dev for local testing
			test: false, // Disabled in test unless explicitly enabled
		},
		options: [
			{ value: false, label: 'Disabled' },
			{ value: true, label: 'Enabled' },
		] satisfies FlagOption<boolean>[],
	},
	[SHOW_TEAM_PRICING]: {
		key: SHOW_TEAM_PRICING,
		name: 'Show Team Pricing',
		description: 'Controls visibility of the team pricing widget.',
		defaultValue: {
			production: false, // Hidden by default in prod
			preview: false, // Hidden in preview for safety
			development: true, // Visible in dev for local testing
			test: false, // Hidden in test unless explicitly enabled
		},
		options: [
			{ value: false, label: 'Hidden' },
			{ value: true, label: 'Visible' },
		] satisfies FlagOption<boolean>[],
	},
} as const

export type FlagKey = keyof typeof FLAGS

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
