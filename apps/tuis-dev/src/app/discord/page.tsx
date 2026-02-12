import * as React from 'react'
import type { Metadata } from 'next'
import { headers } from 'next/headers'
import { ContributorImage } from '@/components/contributor'
import LayoutClient from '@/components/layout-client'
import { getProviders } from '@/server/auth'

import { DiscordConnectButton } from './discord-connect-button'

export const metadata: Metadata = {
	title: 'Join Code with Antonio Discord',
	description: 'Join Code with Antonio Discord',
	openGraph: {
		images: [
			{
				url: 'https://res.cloudinary.com/total-typescript/image/upload/v1738075018/aihero.dev/aihero-discord-og_2x_uneisf.jpg',
			},
		],
	},
}

export default async function Discord() {
	await headers()

	const providers = getProviders()

	const discordProvider = providers?.discord

	return (
		<LayoutClient withContainer>
			<main className="flex min-h-[calc(100vh-var(--nav-height))] flex-col items-center justify-center gap-10 bg-[#7289DA] px-5 text-black dark:text-black">
				<h1 className="mx-auto w-full max-w-xl text-balance text-center text-2xl sm:text-3xl">
					Join <ContributorImage className="inline-block" />{' '}
					{process.env.NEXT_PUBLIC_PARTNER_FIRST_NAME}{' '}
					{process.env.NEXT_PUBLIC_PARTNER_LAST_NAME}'s Code with Antonio
					Discord
				</h1>

				<div>
					{discordProvider ? (
						<DiscordConnectButton discordProvider={discordProvider} />
					) : null}
				</div>
			</main>
		</LayoutClient>
	)
}
