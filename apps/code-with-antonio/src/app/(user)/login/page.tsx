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
		<LayoutClient>
			<div className="bg-muted flex min-h-[calc(100svh-77px)] flex-col items-center justify-center p-6 md:p-10">
				<div className="w-full max-w-sm md:max-w-4xl">
					<Login
						csrfToken={csrfToken}
						providers={providers}
						title={`Log In`}
						subtitle={`We'll create your account if you don't have one yet.`}
					/>
				</div>
			</div>
		</LayoutClient>
	)
}
