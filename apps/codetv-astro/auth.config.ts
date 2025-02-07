import { Auth, type AuthConfig } from '@auth/core'
import GitHub from '@auth/core/providers/github'
import type { Session } from '@auth/core/types'
import authConfig from 'auth:config'

import { courseBuilderAdapter } from './src/db'

export default {
	adapter: courseBuilderAdapter,
	basePath: '/api/auth',
	providers: [
		GitHub({
			clientId: import.meta.env.GITHUB_CLIENT_ID,
			clientSecret: import.meta.env.GITHUB_CLIENT_SECRET,
		}),
	],
} satisfies AuthConfig
