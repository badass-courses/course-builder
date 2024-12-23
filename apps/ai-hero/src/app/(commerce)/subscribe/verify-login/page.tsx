import { ParsedUrlQuery } from 'querystring'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { getCsrf } from '@/app/(user)/login/actions'
import { Login } from '@/components/login'
import config from '@/config'
import { env } from '@/env.mjs'
import { getSubscriptionStatus } from '@/lib/subscriptions'
import { getProviders, getServerAuthSession } from '@/server/auth'

import { CheckoutParamsSchema } from '@coursebuilder/core/types'

export const dynamic = 'force-dynamic'

export default async function LoginPage({
	searchParams,
}: {
	searchParams: Promise<ParsedUrlQuery>
}) {
	await headers()
	const { checkoutUrl, ...checkoutParams } = await searchParams
	const { session, ability } = await getServerAuthSession()
	const user = session?.user
	const providers = getProviders()
	const csrfToken = await getCsrf()

	if (user) {
		const { hasActiveSubscription } = await getSubscriptionStatus(user?.id)

		if (!hasActiveSubscription) {
			return redirect(checkoutUrl as string)
		} else {
			return redirect(`/subscribe/already-subscribed`)
		}
	}

	const parsedCheckoutParams = CheckoutParamsSchema.safeParse(checkoutParams)

	if (!parsedCheckoutParams.success) {
		return redirect('/login')
	}

	const checkoutSearchParams = new URLSearchParams(
		checkoutParams as Record<string, string>,
	)

	return (
		<Login
			title="Login to Subscribe"
			csrfToken={csrfToken}
			providers={providers}
			subtitle={`to ${config.defaultTitle}`}
			callbackUrl={`${env.COURSEBUILDER_URL}/subscribe/logged-in?${checkoutSearchParams.toString()}`}
		/>
	)
}
