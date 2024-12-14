import { ParsedUrlQuery } from 'querystring'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { getCsrf } from '@/app/(user)/login/actions'
import { Login } from '@/components/login'
import config from '@/config'
import { env } from '@/env.mjs'
import { getProviders, getServerAuthSession } from '@/server/auth'

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
		return redirect(checkoutUrl as string)
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
