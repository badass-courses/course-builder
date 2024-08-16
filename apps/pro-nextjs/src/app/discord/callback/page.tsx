import { env } from '@/env.mjs'

export default async function DiscordCallback({
	searchParams,
}: {
	searchParams: { code: string }
}) {
	console.log({ searchParams })
	const code = searchParams.code

	const tokenUrl = new URL('https://discord.com/api/oauth2/token')
	const params = new URLSearchParams({
		client_id: env.NEXT_PUBLIC_DISCORD_CLIENT_ID,
		client_secret: env.DISCORD_CLIENT_SECRET,
		grant_type: 'authorization_code',
		code,
		redirect_uri: `${env.NEXT_PUBLIC_URL}/discord/callback`,
		scope: 'identify guilds.join email guilds',
	})

	const tokenRes = await fetch(tokenUrl.toString(), {
		method: 'POST',
		body: params,
		headers: {
			'Content-Type': 'application/x-www-form-urlencoded',
		},
	})

	const discordToken = await tokenRes.json()

	const userUrl = new URL('https://discord.com/api/users/@me')
	const userRes = await fetch(userUrl.toString(), {
		headers: {
			authorization: `${discordToken.token_type} ${discordToken.access_token}`,
		},
	})
	const discordUser = await userRes.json()

	console.log({ discordUser, discordToken })
	return null
}
