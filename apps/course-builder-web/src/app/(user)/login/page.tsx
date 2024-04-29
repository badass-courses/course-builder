import { headers } from 'next/headers'
import { Layout } from '@/components/app/layout'
import { Login } from '@/components/login'
import { env } from '@/env.mjs'
import { getProviders } from '@/server/auth'

export const dynamic = 'force-dynamic'

export default async function LoginPage() {
	console.log('start login')
	const headerStore = headers()
	const cookie = headerStore.get('cookie')
	const options: RequestInit = {
		headers: {
			...(cookie ? { cookie } : {}),
		},
	}

	const providers = getProviders()

	console.log('providers parsed', { providers })

	const { csrfToken } = await fetch(
		`${env.COURSEBUILDER_URL}/api/auth/csrf`,
		options,
	)
		.then((res) => res.json())
		.catch((e) => {
			console.log(e)
			throw e
		})

	console.log('csrfToken', csrfToken)

	return (
		<Layout>
			<Login csrfToken={csrfToken} providers={providers} />
		</Layout>
	)
}
