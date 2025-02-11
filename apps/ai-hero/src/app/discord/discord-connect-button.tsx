'use client'

import * as React from 'react'
import { Icon } from '@/components/brand/icons'
import { env } from '@/env.mjs'
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
			variant="ghost"
			className="bg-black text-white"
			onClick={() =>
				signIn(discordProvider.id, {
					callbackUrl: `${env.NEXT_PUBLIC_URL}/discord/redirect`,
					redirect: true,
				})
			}
		>
			<Icon
				className="mr-2 flex items-center justify-center"
				name="Discord"
				size="20"
			/>
			Connect to Discord
		</Button>
	)
}
