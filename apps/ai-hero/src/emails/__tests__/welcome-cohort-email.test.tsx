import * as React from 'react'
import { render } from '@react-email/render'
import { describe, expect, it } from 'vitest'

import WelcomeCohortEmail from '../welcome-cohort-email'

describe('WelcomeCohortEmail', () => {
	it('renders consistently', async () => {
		const html = await render(
			<WelcomeCohortEmail
				cohortTitle="Test Cohort"
				url="#day1"
				dayOneUnlockDate="July 2nd, 2055"
			/>,
		)

		expect(html).toMatchSnapshot()
		expect(html).toContain('Day 1')
		expect(html).toContain('/invoices')
	})
})
