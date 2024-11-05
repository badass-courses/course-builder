import * as React from 'react'
import { headers } from 'next/headers'
import { DiscordConnectButton } from '@/app/discord/connect/discord-connect-button'
import { getProviders } from '@/server/auth'

export default async function Discord() {
	await headers()

	const providers = getProviders()

	const discordProvider = providers?.discord

	return (
		<main data-login-template="">
			<h1 data-title="">
				Join {process.env.NEXT_PUBLIC_PARTNER_FIRST_NAME}{' '}
				{process.env.NEXT_PUBLIC_PARTNER_LAST_NAME}'s Blue Collar Coder Discord
			</h1>

			<div data-providers-container="">
				{discordProvider ? (
					<DiscordConnectButton discordProvider={discordProvider} />
				) : null}
			</div>
		</main>
	)
}
