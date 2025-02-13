import { ParsedUrlQuery } from 'querystring'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { stripeProvider } from '@/coursebuilder/stripe-provider'
import { courseBuilderAdapter } from '@/db'
import { getSubscriptionStatus } from '@/lib/subscriptions'
import { getServerAuthSession } from '@/server/auth'

import { CheckoutParamsSchema } from '@coursebuilder/core/types'

export const dynamic = 'force-dynamic'

export default async function LoginPage({
	searchParams,
}: {
	searchParams: Promise<ParsedUrlQuery>
}) {
	await headers()
	const checkoutParams = CheckoutParamsSchema.parse(await searchParams)
	const { session } = await getServerAuthSession()
	const user = session?.user
	const headersList = await headers()
	const countryCode =
		headersList.get('x-vercel-ip-country') ||
		process.env.DEFAULT_COUNTRY ||
		'US'

	const organizationId = headersList.get('x-organization-id') ?? undefined

	if (!user) {
		return redirect('/login')
	}

	const { hasActiveSubscription } = await getSubscriptionStatus(user.id)

	if (hasActiveSubscription) {
		return redirect(`/subscribe/already-subscribed`)
	}

	const stripe = await stripeProvider.createCheckoutSession(
		{ ...checkoutParams, userId: user?.id, organizationId },
		courseBuilderAdapter,
	)
	return redirect(stripe.redirect)
}
