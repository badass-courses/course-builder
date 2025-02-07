import { DISCORD_BOT_TOKEN } from 'astro:env/server'

export async function sendDiscordMessage({ content }: { content: string }) {
	// #bot-testing: 1063702581567828008
	const res = await fetch(
		'https://discord.com/api/v10/channels/1063702581567828008/messages',
		{
			method: 'POST',
			headers: {
				Authorization: `Bot ${DISCORD_BOT_TOKEN}`,
				'Content-Type': 'application/json',
				'User-Agent': 'LWJ Bot (http://www.codetv.dev, v0.1)',
			},
			body: JSON.stringify({
				content,
			}),
		},
	)

	if (!res.ok) {
		throw new Error(res.statusText)
	}

	const data = await res.json()

	return data
}
