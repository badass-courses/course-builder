import * as React from 'react'
import { render } from '@react-email/render'
import { describe, expect, it } from 'vitest'

import WelcomeCohortEmailForTeam from '../welcome-cohort-email-team'

describe('WelcomeCohortEmailForTeam', () => {
	it('renders consistently', async () => {
		const html = await render(
			<WelcomeCohortEmailForTeam
				cohortTitle="Team Cohort"
				dayZeroUrl="#day0"
				dayOneUnlockDate="July 2nd, 2025"
				quantity={5}
			/>,
		)

		expect(html).toMatchSnapshot()
		expect(html).toContain('#day0')
		expect(html).toContain('/team')
	})
})
