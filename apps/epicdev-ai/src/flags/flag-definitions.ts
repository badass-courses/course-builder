import type { FlagOption } from './flags'
import type { Environment } from './flags-env'

export const COMMERCE_ENABLED = 'commerce-enabled'
export const SHOW_TEAM_PRICING = 'show-team-pricing'

export type FlagConfig = {
	key: string
	name: string
	description: string
	defaultValue: Record<Environment, boolean>
	options: FlagOption<boolean>[]
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
		],
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
		],
	},
} as const

export type FlagKey = keyof typeof FLAGS
