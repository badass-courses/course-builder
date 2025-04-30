import { headers } from 'next/headers'
import LayoutClient from '@/components/layout-client'
import { Login } from '@/components/login'
import config from '@/config'
import { getProviders } from '@/server/auth'

import { getCsrf } from './actions'

export const dynamic = 'force-dynamic'

export default async function LoginPage() {
	await headers()

	const providers = getProviders()
	const csrfToken = await getCsrf()

	return (
		<LayoutClient withContainer>
			<Login
				csrfToken={csrfToken}
				providers={providers}
				title={`Sign in`}
				subtitle={`We'll create your account if you don't have one yet.`}
			/>
		</LayoutClient>
	)
}
