'use client'

import { use } from 'react'
import { Icon } from '@/components/brand/icons'
import { env } from '@/env.mjs'
import { Provider } from '@/server/auth'
import type { Account, User } from '@auth/core/types'
import { signIn } from 'next-auth/react'

import { Button } from '@coursebuilder/ui'

export default function ConnectDiscordButton({
	discordProvider,
	userWithAccountsLoader,
}: {
	discordProvider?: Provider | null
	userWithAccountsLoader?: Promise<any & { accounts: Account[] }> | null
}) {
	if (!discordProvider) return null

	const userWithAccounts = userWithAccountsLoader
		? use(userWithAccountsLoader)
		: null

	if (!userWithAccounts) return null

	const discordConnected = Boolean(
		userWithAccounts.accounts.find(
			(account: any) => account.provider === 'discord',
		),
	)
	if (discordConnected) return null

	return (
		<Button
			data-discord-button
			type="button"
			size="sm"
			className="text-white hover:bg-[#5A65EA]/80"
			onClick={() => {
				signIn(discordProvider.id, {
					callbackUrl: `${env.NEXT_PUBLIC_URL}/discord/redirect`,
					redirect: true,
				})
			}}
		>
			<Icon name="Discord" className="mr-2 size-3" /> Connect to Discord
		</Button>
	)
}
