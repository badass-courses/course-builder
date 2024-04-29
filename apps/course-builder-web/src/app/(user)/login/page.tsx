import { headers } from 'next/headers'
import { Layout } from '@/components/app/layout'
import { Login } from '@/components/login'
import { env } from '@/env.mjs'
import { getProviders } from '@/server/auth'
import { getCsrfToken } from 'next-auth/react'

export const dynamic = 'force-dynamic'

export default async function LoginPage() {
	console.log('start login')
	const headerStore = headers()
	const cookie = headerStore.get('cookie')
	const options: RequestInit = {
		headers: {
			...(cookie ? { cookie } : {}),
		},
		cache: 'no-cache',
	}

	console.log('options', options)

	const providers = getProviders()

	console.log('providers parsed', { providers })

	console.log('csrf url', `${env.COURSEBUILDER_URL}/api/auth/csrf`)

	const csrfToken = await fetch(
		`${env.COURSEBUILDER_URL}/api/auth/csrf`,
		options,
	)
		.then(async (res) => {
			console.log('res', res)
			try {
				const resonseText = await res.text()
				console.log('resonseText', resonseText)
				const { csrfToken } = JSON.parse(resonseText)
				return csrfToken
			} catch (e) {
				console.log('error', e)
				throw e
			}
		})
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
