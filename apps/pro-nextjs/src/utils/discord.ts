import { env } from '@/env.mjs'

export function getDiscordAuthorizeURL(domainUrl: string) {
	const url = new URL('https://discord.com/api/oauth2/authorize')
	url.searchParams.set('client_id', env.NEXT_PUBLIC_DISCORD_CLIENT_ID)
	url.searchParams.set('redirect_uri', `${domainUrl}/discord/callback`)
	url.searchParams.set('response_type', 'code')
	url.searchParams.set('scope', 'identify guilds.join email guilds')
	return url.toString()
}
