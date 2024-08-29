import { headers } from 'next/headers'
import { Login } from '@/components/login'
import { getProviders } from '@/server/auth'

import { getCsrf } from './actions'

export const dynamic = 'force-dynamic'

export default async function LoginPage() {
	headers()

	const providers = getProviders()
	const csrfToken = await getCsrf()

	return <Login csrfToken={csrfToken} providers={providers} />
}
