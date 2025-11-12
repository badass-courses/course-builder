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
				className="!min-h-[calc(100dvh-var(--nav-height))]"
				csrfToken={csrfToken}
				providers={providers}
				title={`Log In`}
				subtitle={`We'll create your account if you don't have one yet.`}
			/>
		</LayoutClient>
	)
}
