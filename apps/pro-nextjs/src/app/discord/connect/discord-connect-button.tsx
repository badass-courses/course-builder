'use client'

import * as React from 'react'
import { Icon } from '@/components/icons'
import { signIn } from 'next-auth/react'

import { Button } from '@coursebuilder/ui'

export function DiscordConnectButton({
	discordProvider,
}: {
	discordProvider: { id: string; name: string }
}) {
	return (
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
	)
}
