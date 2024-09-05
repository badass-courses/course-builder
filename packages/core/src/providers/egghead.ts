import { OAuthConfig, OAuthUserConfig } from '@auth/core/providers'

export interface EggheadProfile extends Record<string, any> {
	id: string
	name: string
	email: string
	avatar_url: string
	instructor_id?: number
	roles: string[]
	instructor?: {
		id: number
		first_name: string
		last_name: string
		avatar_url: string
		email: string
		slug: string
	}
}

export default function egghead(
	config: OAuthUserConfig<EggheadProfile>,
): OAuthConfig<EggheadProfile> {
	return {
		id: 'egghead',
		name: 'egghead',
		type: 'oauth',
		token: 'https://app.egghead.io/oauth/token',
		authorization: {
			url: 'https://app.egghead.io/oauth/authorize?response_type=code',
			params: { scope: '' },
		},
		userinfo: {
			url: 'https://app.egghead.io/api/v1/users/current',
			async request({ tokens, provider }: any) {
				const profile = await fetch(provider.userinfo?.url as URL, {
					headers: {
						Authorization: `Bearer ${tokens.access_token}`,
						'User-Agent': 'authjs',
					},
				}).then(async (res) => await res.json())
				return profile
			},
		},
		profile(profile: EggheadProfile) {
			return {
				id: profile.id,
				name: profile.name,
				email: profile.email,
				image: profile.avatar_url,
			}
		},
		clientId: config.clientId,
		clientSecret: config.clientSecret,
		allowDangerousEmailAccountLinking: config.allowDangerousEmailAccountLinking,
	}
}
