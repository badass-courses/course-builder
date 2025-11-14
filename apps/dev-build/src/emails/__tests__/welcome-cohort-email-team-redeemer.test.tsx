import * as React from 'react'
import { render } from '@react-email/render'
import { describe, expect, it } from 'vitest'

import WelcomeCohortEmailForTeamRedeemer from '../welcome-cohort-email-team-redeemer'

describe('WelcomeCohortEmailForTeamRedeemer', () => {
	it('renders consistently', async () => {
		const html = await render(
			<WelcomeCohortEmailForTeamRedeemer
				cohortTitle="Redeemer Cohort"
				url="#day1"
				dayOneUnlockDate="July 2nd, 2055"
			/>,
		)

		expect(html).toMatchSnapshot()
		expect(html).toContain('Day 1')
	})
})
