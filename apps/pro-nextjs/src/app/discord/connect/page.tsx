import * as React from 'react'
import { headers } from 'next/headers'
import { DiscordConnectButton } from '@/app/discord/connect/discord-connect-button'
import { getProviders } from '@/server/auth'

export default async function Discord() {
	headers()

	const providers = getProviders()

	const discordProvider = providers?.discord

	return (
		<main data-login-template="">
			<h1 data-title="">Join the Discord Server</h1>

			<div data-providers-container="">
				{discordProvider ? (
					<DiscordConnectButton discordProvider={discordProvider} />
				) : null}
			</div>
		</main>
	)
}
