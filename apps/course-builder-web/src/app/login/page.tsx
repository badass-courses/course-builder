import { Login } from '@/components/login'
import { authOptions } from '@/server/auth'
import { Provider } from '@auth/core/providers'

export default function LoginPage() {
	const providers = authOptions.providers
	return (
		<Login
			providers={providers.map((provider: Provider) => {
				return {
					// @ts-ignore
					id: provider.id,
					name: provider.name,
				}
			})}
		/>
	)
}
