'use client'

import { Icon } from '@/components/brand/icons'
import { Provider } from '@/server/auth'
import { signIn } from 'next-auth/react'

import { Button } from '@coursebuilder/ui'

export default function ConnectDiscordButton({
	discordProvider,
	callbackUrl,
}: {
	discordProvider?: Provider | null
	callbackUrl: string
}) {
	if (!discordProvider) return null
	return (
		<Button
			data-discord-button
			type="button"
			size="sm"
			className="text-white hover:bg-[#5A65EA]/80"
			onClick={() => {
				signIn(discordProvider.id, {
					callbackUrl: callbackUrl,
				})
			}}
		>
			<Icon name="Discord" className="mr-2 size-3" /> Connect Discord
		</Button>
	)
}
