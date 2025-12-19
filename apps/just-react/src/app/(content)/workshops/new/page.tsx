import * as React from 'react'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import CreateResourcePage from '@/components/resources-crud/create-resource-page'
import { env } from '@/env.mjs'
import { getServerAuthSession } from '@/server/auth'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
	title: 'Create a New Workshop',
	openGraph: {
		images: [
			{
				url: `${env.NEXT_PUBLIC_URL}/api/og?title=${encodeURIComponent('Create a New Workshop')}`,
			},
		],
	},
}

export default async function NewWorkshopPage() {
	const { ability } = await getServerAuthSession()

	if (!ability.can('create', 'Content')) {
		notFound()
	}

	return (
		<main className="container flex min-h-[calc(100vh-var(--nav-height))] flex-col border-x">
			<h1 className="py-16 text-center text-2xl font-semibold">
				Create a New Workshop
			</h1>
			<CreateResourcePage resourceType="workshop" />
		</main>
	)
}
