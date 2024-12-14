import { ParsedUrlQuery } from 'querystring'
import { headers } from 'next/headers'
import { notFound, redirect } from 'next/navigation'
import { stripeProvider } from '@/coursebuilder/stripe-provider'
import { courseBuilderAdapter, db } from '@/db'
import { getServerAuthSession } from '@/server/auth'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const CheckoutParamsSchema = z.object({
	ip_address: z.string().optional(),
	productId: z.string(),
	quantity: z.coerce
		.number()
		.optional()
		.transform((val) => Number(val) || 0),
	country: z.string().optional(),
	couponId: z.string().optional(),
	userId: z.string().optional(),
	upgradeFromPurchaseId: z.string().optional(),
	bulk: z.preprocess((val) => {
		return val === 'false' ? false : Boolean(val)
	}, z.boolean()),
	cancelUrl: z.string(),
	usedCouponId: z.string().optional(),
	organizationId: z.string().optional(),
})

export default async function LoginPage({
	searchParams,
}: {
	searchParams: Promise<ParsedUrlQuery>
}) {
	await headers()
	const checkoutParams = CheckoutParamsSchema.parse(await searchParams)
	const { session } = await getServerAuthSession()
	const user = session?.user

	if (user) {
		const memberships = await courseBuilderAdapter.getMembershipsForUser(
			user.id,
		)
		let hasActiveSubscription = false
		for (const membership of memberships) {
			if (!membership.organizationId) continue
			const organization = await courseBuilderAdapter.getOrganization(
				membership.organizationId,
			)
			if (!organization) continue
			const subscriptions = await db.query.subscription.findMany({
				where: (subscription, { eq, and }) =>
					and(
						eq(subscription.organizationId, organization.id),
						eq(subscription.status, 'active'),
					),
			})
			if (subscriptions.length > 0) {
				hasActiveSubscription = true
				break
			}
		}

		if (!hasActiveSubscription) {
			const stripe = await stripeProvider.createCheckoutSession(
				{ ...checkoutParams, userId: user?.id },
				courseBuilderAdapter,
			)
			return redirect(stripe.redirect)
		} else {
			return redirect(`/subscribe/already-subscribed`)
		}
	}

	return notFound()
}
