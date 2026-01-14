import { notFound } from 'next/navigation'
import { getShortlinks } from '@/lib/shortlinks-query'
import { getServerAuthSession } from '@/server/auth'

import ShortlinksManagement from './shortlinks-client-page'

export default async function ShortlinksManagementPage() {
	const { ability } = await getServerAuthSession()

	if (!ability.can('manage', 'all')) {
		notFound()
	}

	const shortlinks = await getShortlinks()
	return <ShortlinksManagement initialShortlinks={shortlinks} />
}
