'use server'

import { db } from '@/db'
import { accounts, users } from '@/db/schema'
import { env } from '@/env.mjs'
import { getServerAuthSession } from '@/server/auth'
import { and, eq } from 'drizzle-orm'

import { isEmpty } from '@coursebuilder/nodash'

export async function getDiscordAccount(userId: string) {
	return db.query.accounts.findFirst({
		where: and(eq(accounts.userId, userId), eq(accounts.provider, 'discord')),
	})
}

export async function disconnectDiscord() {
	const { session } = await getServerAuthSession()
	if (!session?.user) return false

	const user = await db.query.users.findFirst({
		where: eq(users.id, session.user.id),
		with: {
			accounts: {
				where: eq(accounts.provider, 'discord'),
			},
		},
	})

	if (isEmpty(user?.accounts) || !user) return false

	await db
		.delete(accounts)
		.where(and(eq(accounts.provider, 'discord'), eq(accounts.userId, user.id)))

	return true
}

export async function fetchJsonAsDiscordBot<JsonType = unknown>(
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
	return (await res.json().catch((e) => e)) as JsonType
}

export async function fetchAsDiscordBot(
	endpoint: string,
	config?: RequestInit,
) {
	const url = new URL(`https://discord.com/api/${endpoint}`)
	return await fetch(url.toString(), {
		...config,
		headers: {
			Authorization: `Bot ${env.DISCORD_BOT_TOKEN}`,
			...config?.headers,
		},
	})
}
