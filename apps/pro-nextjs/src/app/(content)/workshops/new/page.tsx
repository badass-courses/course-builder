import * as React from 'react'
import { notFound } from 'next/navigation'
import CreateResourcePage from '@/components/resources-crud/create-resource-page'
import { getServerAuthSession } from '@/server/auth'

export const dynamic = 'force-dynamic'

export default async function NewWorkshopPage() {
	const { ability } = await getServerAuthSession()

	if (!ability.can('create', 'Content')) {
		notFound()
	}

	return (
		<main className="container flex min-h-[calc(100vh-var(--nav-height))] flex-col border-x">
			<h1 className="fluid-2xl py-16 text-center font-semibold">
				Create a New Workshop
			</h1>
			<CreateResourcePage resourceType="workshop" />
		</main>
	)
}
