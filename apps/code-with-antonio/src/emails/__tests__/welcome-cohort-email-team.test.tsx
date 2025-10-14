import * as React from 'react'
import { render } from '@react-email/render'
import { describe, expect, it } from 'vitest'

import WelcomeCohortEmailForTeam from '../welcome-cohort-email-team'

describe('WelcomeCohortEmailForTeam', () => {
	it('renders consistently', async () => {
		const html = await render(
			<WelcomeCohortEmailForTeam
				cohortTitle="Team Cohort"
				url="#day1"
				dayOneUnlockDate="July 2nd, 2055"
				quantity={5}
			/>,
		)

		expect(html).toMatchSnapshot()
		expect(html).toContain('Day 1')
		expect(html).toContain('/team')
	})
})
