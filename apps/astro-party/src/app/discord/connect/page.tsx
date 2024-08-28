import * as React from 'react'
import { headers } from 'next/headers'
import { ConnectDiscordButton } from '@/app/discord/connect/connect-discord-button'
import { Layout } from '@/components/layout'
import { getProviders } from '@/server/auth'

export default async function Discord() {
	headers()

	const providers = getProviders()

	const discordProvider = providers?.discord

	return (
		<Layout>
			<main data-login-template="">
				<h1 data-title="">Join the Discord Server</h1>

				<div data-providers-container="">
					{discordProvider ? (
						<ConnectDiscordButton discordProvider={discordProvider} />
					) : null}
				</div>
			</main>
		</Layout>
	)
}
