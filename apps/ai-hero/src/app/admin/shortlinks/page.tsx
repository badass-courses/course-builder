import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getRecentClickStats, getShortlinks } from '@/lib/shortlinks-query'
import { getServerAuthSession } from '@/server/auth'

import ShortlinksManagement from './shortlinks-client-page'

export const metadata: Metadata = {
	title: 'Shortlinks | AI Hero by Matt Pocock',
}

export default async function ShortlinksManagementPage() {
	const { ability } = await getServerAuthSession()

	if (!ability.can('manage', 'all')) {
		notFound()
	}

	const [shortlinks, recentStats] = await Promise.all([
		getShortlinks(),
		getRecentClickStats(),
	])

	return (
		<ShortlinksManagement
			initialShortlinks={shortlinks}
			recentStats={recentStats}
		/>
	)
}
