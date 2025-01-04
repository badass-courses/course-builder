import type { AuthConfig } from '@auth/core'
import GitHub from '@auth/core/providers/github'

export default {
	basePath: '/api/auth',
	providers: [
		GitHub({
			clientId: import.meta.env.GITHUB_CLIENT_ID,
			clientSecret: import.meta.env.GITHUB_CLIENT_SECRET,
		}),
	],
} satisfies AuthConfig
