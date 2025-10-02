import type { Metadata } from 'next'
import LayoutClient from '@/components/layout-client'
import config from '@/config'
import { env } from '@/env.mjs'
import { createList, getAllLists } from '@/lib/lists-query'
import { getServerAuthSession } from '@/server/auth'

import { CreateListForm } from './_components/create-list-form'
import { ListsTable } from './_components/lists-table'

export const metadata: Metadata = {
	title: `AI Engineering Lists by ${config.author}`,
	openGraph: {
		images: [
			{
				url: `${env.NEXT_PUBLIC_URL}/api/og?title=${encodeURIComponent(`AI Engineering Posts by ${config.author}`)}`,
			},
		],
	},
}

export default async function ListsPage() {
	const lists = await getAllLists()
	const { ability } = await getServerAuthSession()

	const canCreateContent = ability.can('create', 'Content')
	return (
		<LayoutClient withContainer className="">
			<main className="p-5">
				<h1 className="text-xl font-bold sm:text-2xl">Lists</h1>
				<div className="flex flex-col gap-5">
					<ListsTable canCreateContent={canCreateContent} lists={lists} />
					{canCreateContent && <CreateListForm />}
				</div>
			</main>
		</LayoutClient>
	)
}
