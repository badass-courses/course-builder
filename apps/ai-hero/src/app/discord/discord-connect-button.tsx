'use client'

import * as React from 'react'
import { Icon } from '@/components/brand/icons'
import { env } from '@/env.mjs'
import { signIn } from 'next-auth/react'

import { Button } from '@coursebuilder/ui'

export function DiscordConnectButton({
	discordProvider,
	children,
}: {
	discordProvider: { id: string; name: string }
	children?: React.ReactNode
}) {
	return (
		<Button
			data-button=""
			variant="ghost"
			className="h-full bg-black text-white"
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
			{children || 'Connect to Discord'}
		</Button>
	)
}
