import WelcomeCohortEmail from '@/emails/welcome-cohort-email'
import WelcomeCohortEmailForTeam from '@/emails/welcome-cohort-email-team'
import WelcomeCohortEmailForTeamRedeemer from '@/emails/welcome-cohort-email-team-redeemer'

export const CohortWelcomeEmailVariants = {
	individual: WelcomeCohortEmail,
	team_purchaser: WelcomeCohortEmailForTeam,
	coupon_redeemer: WelcomeCohortEmailForTeamRedeemer,
}

export type GetCohortWelcomeEmailVariantParams = {
	isTeamPurchase: boolean
	isFullPriceCouponRedemption: boolean
}

export function getCohortWelcomeEmailVariant({
	isTeamPurchase,
	isFullPriceCouponRedemption,
}: GetCohortWelcomeEmailVariantParams) {
	if (isTeamPurchase) return CohortWelcomeEmailVariants.team_purchaser
	if (isFullPriceCouponRedemption)
		return CohortWelcomeEmailVariants.coupon_redeemer
	return CohortWelcomeEmailVariants.individual
}
