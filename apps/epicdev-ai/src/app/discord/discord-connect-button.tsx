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
			className="hover:text-primary hover:bg-card-muted bg-card h-12 w-full rounded-lg border px-4 shadow-[0px_4px_38px_-14px_rgba(0,_0,_0,_0.1)] ease-out md:w-auto"
			onClick={() =>
				signIn(discordProvider.id, {
					callbackUrl: `${env.NEXT_PUBLIC_URL}/discord/redirect`,
					redirect: true,
				})
			}
		>
			<Icon
				className="flex items-center justify-center"
				name="Discord"
				size="20"
			/>
			{children || 'Connect to Discord'}
		</Button>
	)
}
