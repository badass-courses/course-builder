import * as React from 'react'
import { render } from '@react-email/render'
import { describe, expect, it } from 'vitest'

import WelcomeCohortEmail from '../welcome-cohort-email'

describe('WelcomeCohortEmail', () => {
	it('renders consistently', async () => {
		const html = await render(
			<WelcomeCohortEmail
				cohortTitle="Test Cohort"
				dayZeroUrl="#day0"
				dayOneUnlockDate="July 2nd, 2025"
			/>,
		)

		expect(html).toMatchSnapshot()
		expect(html).toContain('#day0')
		expect(html).toContain('/invoices')
	})
})
