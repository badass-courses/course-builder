import type { AdapterUser } from '@auth/core/adapters'
import type { Account, User } from '@auth/core/types'

export const OAUTH_PROVIDER_ACCOUNT_LINKED_EVENT =
	'user/oauth-provider-account-linked'

export type OauthProviderAccountLinked = {
	name: typeof OAUTH_PROVIDER_ACCOUNT_LINKED_EVENT
	data: {
		account: Account
		profile: User | AdapterUser
	}
}
