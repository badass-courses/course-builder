import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getShortlinkAnalytics, getShortlinkById } from '@/lib/shortlinks-query'
import { getServerAuthSession } from '@/server/auth'
import { ArrowLeft } from 'lucide-react'

import { Button } from '@coursebuilder/ui'

import ShortlinkAnalyticsView from './analytics-client-page'

export default async function ShortlinkAnalyticsPage({
	params,
}: {
	params: Promise<{ id: string }>
}) {
	const { ability } = await getServerAuthSession()

	if (!ability.can('manage', 'all')) {
		notFound()
	}

	const { id } = await params
	const shortlink = await getShortlinkById(id)

	if (!shortlink) {
		notFound()
	}

	const analytics = await getShortlinkAnalytics(id)

	return (
		<main className="flex w-full flex-col p-10">
			<div className="mx-auto flex w-full max-w-5xl flex-col gap-5">
				<div className="flex items-center gap-4">
					<Link href="/admin/shortlinks">
						<Button variant="ghost" size="icon">
							<ArrowLeft className="h-4 w-4" />
						</Button>
					</Link>
					<div>
						<h1 className="font-heading text-xl font-bold sm:text-3xl">
							Analytics for /s/{shortlink.slug}
						</h1>
						<p className="text-muted-foreground text-sm">
							Destination: {shortlink.url}
						</p>
					</div>
				</div>

				<ShortlinkAnalyticsView analytics={analytics} shortlink={shortlink} />
			</div>
		</main>
	)
}
