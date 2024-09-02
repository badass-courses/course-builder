import { notFound, redirect } from 'next/navigation'
import { db } from '@/db'
import { users } from '@/db/schema'
import { env } from '@/env.mjs'
import { getServerAuthSession } from '@/server/auth'
import { eq } from 'drizzle-orm'

import { User } from '@coursebuilder/core/schemas'

type DiscordUser = {
	id: string
	username: string
	discriminator: string
	avatar?: string
}
type DiscordMember = { user: DiscordUser; roles: Array<string> }
type DiscordToken = {
	token_type: string
	access_token: string
}
type DiscordError = { message: string; code: number }

async function getMember(discordUserId: string) {
	const member = await fetchJsonAsDiscordBot<DiscordMember | DiscordError>(
		`guilds/${env.DISCORD_GUILD_ID}/members/${discordUserId}`,
	)
	return member
}

async function fetchJsonAsDiscordBot<JsonType = unknown>(
	endpoint: string,
	config?: RequestInit,
) {
	const res = await fetchAsDiscordBot(endpoint, {
		...config,
		headers: {
			'Content-Type': 'application/json',
			...config?.headers,
		},
	})
	const json = (await res.json()) as JsonType
	return json
}

async function fetchAsDiscordBot(endpoint: string, config?: RequestInit) {
	const url = new URL(`https://discord.com/api/${endpoint}`)
	const res = await fetch(url.toString(), {
		...config,
		headers: {
			Authorization: `Bot ${env.DISCORD_BOT_TOKEN}`,
			...config?.headers,
		},
	})
	return res
}

async function addUserToDiscord({
	discordUser,
	discordToken,
}: {
	discordUser: DiscordUser
	discordToken: DiscordToken
}) {
	await fetchAsDiscordBot(
		`guilds/${env.DISCORD_GUILD_ID}/members/${discordUser.id}`,
		{
			method: 'PUT',
			body: JSON.stringify({ access_token: discordToken.access_token }),
			headers: { 'Content-Type': 'application/json' },
		},
	)
}

async function updateDiscordRolesForUser(
	discordMember: DiscordMember,
	user: User,
) {
	const fullUser = await db.query.users.findFirst({
		where: (users, { eq }) => eq(users.id, user.id),
	})

	await db
		.update(users)
		.set({
			fields: {
				...(fullUser && fullUser.fields),
				discordMemberId: discordMember.user.id,
			},
		})
		.where(eq(users.id, user.id))
}

export default async function DiscordCallback({
	searchParams,
}: {
	searchParams: { code: string }
}) {
	const { session } = await getServerAuthSession()

	const user = session?.user

	if (!user) {
		redirect(`/login`)
	}

	console.log({ searchParams })
	const code = searchParams.code

	const tokenUrl = new URL('https://discord.com/api/oauth2/token')
	const params = new URLSearchParams({
		client_id: env.DISCORD_CLIENT_ID,
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

	await addUserToDiscord({ discordUser, discordToken })

	await new Promise((resolve) => setTimeout(resolve, 300))

	const discordMember = await getMember(discordUser.id)
	if ('user' in discordMember) {
		await updateDiscordRolesForUser(discordMember, user)
	} else if ('message' in discordMember) {
		throw new Error(
			`Discord Error (${discordMember.code}): ${discordMember.message}`,
		)
	}

	console.log({ discordUser, discordToken })
	redirect(env.NEXT_PUBLIC_DISCORD_INVITE_URL)
}
