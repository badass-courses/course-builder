import { ParsedUrlQuery } from 'querystring'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { getCsrf } from '@/app/(user)/login/actions'
import LayoutClient from '@/components/layout-client'
import { Login } from '@/components/login'
import { db } from '@/db'
import { purchases } from '@/db/schema'
import { env } from '@/env.mjs'
import { getProduct } from '@/lib/products-query'
import { getSubscriptionStatus } from '@/lib/subscriptions'
import { getProviders, getServerAuthSession } from '@/server/auth'
import { and, eq, inArray, isNull } from 'drizzle-orm'

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

	const parsedCheckoutParams = CheckoutParamsSchema.safeParse(checkoutParams)

	if (!parsedCheckoutParams.success) {
		return redirect('/login')
	}

	if (product?.type === 'cohort') {
		if (user) {
			const cohortProductPurchases = await db.query.purchases.findMany({
				where: and(
					eq(purchases.userId, user.id),
					eq(purchases.productId, product.id),
					inArray(purchases.status, ['Valid', 'Restricted']),
					isNull(purchases.bulkCouponId),
				),
			})

			if (cohortProductPurchases.length > 0) {
				return redirect(`/invoices`)
			} else {
				if (typeof checkoutUrl !== 'string' || !checkoutUrl) {
					return redirect('/subscribe/error')
				}
				return redirect(checkoutUrl)
			}
		}
	}

	if (product?.type === 'membership') {
		if (user) {
			const { hasActiveSubscription } = await getSubscriptionStatus(user?.id)

			if (!hasActiveSubscription) {
				if (typeof checkoutUrl !== 'string' || !checkoutUrl) {
					return redirect('/subscribe/error')
				}
				return redirect(checkoutUrl)
			} else {
				return redirect(`/subscribe/already-subscribed`)
			}
		}
	}

	const checkoutSearchParams = new URLSearchParams(
		checkoutParams as Record<string, string>,
	)

	return (
		<LayoutClient
			withFooter={false}
			withNavigation={false}
			withContainer={false}
		>
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
