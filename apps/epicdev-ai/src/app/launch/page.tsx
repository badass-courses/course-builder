import type { Metadata } from 'next'
import Script from 'next/script'
import { launch } from '@/app/launch/actions'
import RedButton from '@/app/launch/red-button'
import { commerceEnabled } from '@/flags'
import { getServerAuthSession } from '@/server/auth'

export async function generateMetadata(): Promise<Metadata> {
	return {
		title: 'Launch',
		description: 'Launch EpicAI Pro',
		openGraph: {
			images: [
				{
					url: `/api/og/default?title=${encodeURIComponent('Launch Epic AI Pro')}`,
				},
			],
		},
	}
}

export default async function LaunchPage() {
	const { ability } = await getServerAuthSession()
	const canPress = ability.can('manage', 'all')
	const isCommerceEnabled = await commerceEnabled()

	return (
		<div>
			<Script
				async
				src="https://cursor-party.vojtaholik.partykit.dev/cursors.js"
			/>
			<form
				action={async () => {
					'use server'
					if (canPress) {
						await launch()
					}
				}}
			>
				<RedButton canPress={canPress} isCommerceEnabled={isCommerceEnabled} />
			</form>
		</div>
	)
}
