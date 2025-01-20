import { flag } from '@vercel/flags/next'

export const showTeamPricingFlag = flag({
	key: 'show-team-pricing',
	decide() {
		// default to true for now, we can adjust this later
		return true
	},
})
