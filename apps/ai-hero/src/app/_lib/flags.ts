import { flags } from '@vercel/flags/next'

export const { flag } = flags({
	flags: {
		'show-team-pricing': {
			type: 'boolean',
			defaultValue: true,
		},
	},
})

export const showTeamPricingFlag = flag('show-team-pricing')
