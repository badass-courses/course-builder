import * as React from 'react'
import { notFound } from 'next/navigation'
import { getAbility } from '@/ability'
import CreateResourcePage from '@/components/resources-crud/create-resource-page'
import { getServerAuthSession } from '@/server/auth'

export const dynamic = 'force-dynamic'

export default async function NewTutorialPage() {
	const session = await getServerAuthSession()
	const ability = getAbility({ user: session?.user })

	if (!ability.can('create', 'Content')) {
		notFound()
	}

	return (
		<div className="flex flex-col">
			<h1 className="text-3xl font-bold sm:text-4xl">Create a New Tutorial</h1>
			<CreateResourcePage resourceType="tutorial" />
		</div>
	)
}
