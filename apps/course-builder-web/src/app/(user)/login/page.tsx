import { headers } from 'next/headers'
import { Layout } from '@/components/app/layout'
import { Login } from '@/components/login'
import { env } from '@/env.mjs'
import { getProviders } from '@/server/auth'
import { getCsrfToken } from 'next-auth/react'

export const dynamic = 'force-dynamic'

export default async function LoginPage() {
	const headerStore = headers()
	const cookie = headerStore.get('cookie')
	console.log({ cookie })
	const options: RequestInit = {
		headers: {
			...(cookie ? { cookie } : {}),
		},
	}
	const providers = getProviders()

	const { csrfToken } = await fetch(
		`${env.COURSEBUILDER_URL}/api/auth/csrf`,
		options,
	).then((res) => res.json())

	console.log({ providers, csrfToken })
	return (
		<Layout>
			<Login csrfToken={csrfToken} providers={providers} />
		</Layout>
	)
}
