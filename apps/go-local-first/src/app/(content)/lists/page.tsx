import type { Metadata } from 'next'
import config from '@/config'
import { env } from '@/env.mjs'
import { getAllLists } from '@/lib/lists-query'
import { getServerAuthSession } from '@/server/auth'

import { CreateListForm } from './_components/create-list-form'
import { ListsTable } from './_components/lists-table'

export const metadata: Metadata = {
	title: `Local-first Lists by ${config.author}`,
	openGraph: {
		images: [
			{
				url: `${env.NEXT_PUBLIC_URL}/api/og?title=${encodeURIComponent(`Local-first Lists by ${config.author}`)}`,
			},
		],
	},
}

export default async function ListsPage() {
	const lists = await getAllLists()
	const { ability } = await getServerAuthSession()

	const canCreateContent = ability.can('create', 'Content')
	return (
		<div className="container flex flex-col gap-4 py-8">
			<h1 className="fluid-2xl font-bold">Lists</h1>
			<div className="flex flex-col gap-8 lg:flex-col">
				<ListsTable canCreateContent={canCreateContent} lists={lists} />
				{canCreateContent && <CreateListForm />}
			</div>
		</div>
	)
}
