import { ParsedUrlQuery } from 'querystring'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { getCsrf } from '@/app/(user)/login/actions'
import LayoutClient from '@/components/layout-client'
import { Login } from '@/components/login'
import config from '@/config'
import { env } from '@/env.mjs'
import { getProduct } from '@/lib/products-query'
import { getSubscriptionStatus } from '@/lib/subscriptions'
import { getProviders, getServerAuthSession } from '@/server/auth'

import { CheckoutParamsSchema } from '@coursebuilder/core/types'

export const dynamic = 'force-dynamic'

/**
 * This page is used to verify that the user is logged in and has an active subscription.
 * It is used to redirect the user to the login page if they are not logged in.
 * It is also used to redirect the user to the checkout page if they are logged in and have an active subscription.
 * @param param0
 * @returns
 */
export default async function VerifyLoginPage({
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
	const product = await getProduct(checkoutParams.productId as string)

	let callbackUrl = `${env.COURSEBUILDER_URL}/subscribe/logged-in`

	console.log({ checkoutUrl, checkoutParams, product })

	const parsedCheckoutParams = CheckoutParamsSchema.safeParse(checkoutParams)

	console.dir({ parsedCheckoutParams }, { depth: null })

	if (!parsedCheckoutParams.success) {
		return redirect('/login')
	}

	if (product?.type === 'cohort') {
		// TODO: check if user is already actively in cohort
	}

	if (product?.type === 'membership') {
		if (user) {
			const { hasActiveSubscription } = await getSubscriptionStatus(user?.id)

			if (!hasActiveSubscription) {
				return redirect(checkoutUrl as string)
			} else {
				return redirect(`/subscribe/already-subscribed`)
			}
		}
	}

	const checkoutSearchParams = new URLSearchParams(
		checkoutParams as Record<string, string>,
	)

	return (
		<LayoutClient withContainer>
			<Login
				title="Log in to join"
				csrfToken={csrfToken}
				providers={providers}
				subtitle={`We'll create your account if you don't have one yet.`}
				callbackUrl={`${callbackUrl}?${checkoutSearchParams.toString()}`}
			/>
		</LayoutClient>
	)
}
