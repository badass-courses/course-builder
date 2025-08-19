import WelcomeCohortEmail from '@/emails/welcome-cohort-email'
import WelcomeCohortEmailForTeam from '@/emails/welcome-cohort-email-team'
import WelcomeCohortEmailForTeamRedeemer from '@/emails/welcome-cohort-email-team-redeemer'
import { describe, expect, it } from 'vitest'

import { getCohortWelcomeEmailVariant } from '../get-cohort-welcome-email-variant'

describe('getCohortWelcomeEmailVariant', () => {
	it('returns team purchaser component', () => {
		const Comp = getCohortWelcomeEmailVariant({
			isTeamPurchase: true,
			isFullPriceCouponRedemption: false,
		})
		expect(Comp).toBe(WelcomeCohortEmailForTeam)
	})

	it('returns coupon redeemer component', () => {
		const Comp = getCohortWelcomeEmailVariant({
			isTeamPurchase: false,
			isFullPriceCouponRedemption: true,
		})
		expect(Comp).toBe(WelcomeCohortEmailForTeamRedeemer)
	})

	it('returns individual component', () => {
		const Comp = getCohortWelcomeEmailVariant({
			isTeamPurchase: false,
			isFullPriceCouponRedemption: false,
		})
		expect(Comp).toBe(WelcomeCohortEmail)
	})
})
