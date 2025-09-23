'use client'

import * as React from 'react'
import { Icon } from '@/components/brand/icons'
import { env } from '@/env.mjs'
import { signIn } from 'next-auth/react'

import { Button } from '@coursebuilder/ui'
import { cn } from '@coursebuilder/ui/utils/cn'

export function DiscordConnectButton({
	discordProvider,
	children,
	className,
}: {
	discordProvider: { id: string; name: string }
	children?: React.ReactNode
	className?: string
}) {
	return (
		<Button
			data-button=""
			variant="ghost"
			className={cn('h-full', className)}
			onClick={() =>
				signIn(discordProvider.id, {
					callbackUrl: `${env.NEXT_PUBLIC_URL}/discord/redirect`,
					redirect: true,
				})
			}
		>
			<Icon
				className="mr-0.5 flex items-center justify-center"
				name="Discord"
				size="20"
			/>
			{children || 'Connect to Discord'}
		</Button>
	)
}
