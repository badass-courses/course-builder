import WelcomeWorkshopEmail from '@/emails/welcome-workshop-email'
import WelcomeWorkshopEmailForTeam from '@/emails/welcome-workshop-email-team'
import WelcomeWorkshopEmailForTeamRedeemer from '@/emails/welcome-workshop-email-team-redeemer'

export const WorkshopWelcomeEmailVariants = {
	individual: WelcomeWorkshopEmail,
	team_purchaser: WelcomeWorkshopEmailForTeam,
	coupon_redeemer: WelcomeWorkshopEmailForTeamRedeemer,
}

export type GetWorkshopWelcomeEmailVariantParams = {
	isTeamPurchase: boolean
	isFullPriceCouponRedemption: boolean
}

export function getWorkshopWelcomeEmailVariant({
	isTeamPurchase,
	isFullPriceCouponRedemption,
}: GetWorkshopWelcomeEmailVariantParams) {
	if (isTeamPurchase) return WorkshopWelcomeEmailVariants.team_purchaser
	if (isFullPriceCouponRedemption)
		return WorkshopWelcomeEmailVariants.coupon_redeemer
	return WorkshopWelcomeEmailVariants.individual
}
