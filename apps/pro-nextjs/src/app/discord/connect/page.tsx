import * as React from 'react'
import { headers } from 'next/headers'
import { Icon } from '@/components/icons'
import { getProviders } from '@/server/auth'
import { signIn } from 'next-auth/react'

import { Button } from '@coursebuilder/ui'

export default async function Discord() {
	headers()

	const providers = getProviders()

	const discordProvider = providers?.discord

	return (
		<main data-login-template="">
			<h1 data-title="">Join the Discord Server</h1>

			<div data-providers-container="">
				{discordProvider ? (
					<Button
						data-button=""
						variant="outline"
						onClick={() => signIn(discordProvider.id)}
					>
						<Icon
							className="mr-2 flex items-center justify-center"
							name="Discord"
							size="20"
						/>
						Connect to {discordProvider.name}
					</Button>
				) : null}
			</div>
		</main>
	)
}
