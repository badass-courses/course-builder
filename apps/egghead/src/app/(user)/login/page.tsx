import { headers } from 'next/headers'
import { Layout } from '@/components/app/layout'
import { Login } from '@/components/login'
import { getProviders } from '@/server/auth'

import { getCsrf } from './actions'

export const dynamic = 'force-dynamic'

export default async function LoginPage() {
	await headers()

	const providers = getProviders()
	const csrfToken = await getCsrf()

	return (
		<Layout>
			<Login csrfToken={csrfToken} providers={providers} />
		</Layout>
	)
}
