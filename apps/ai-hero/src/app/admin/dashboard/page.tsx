import React from 'react'
import { notFound } from 'next/navigation'
import { getServerAuthSession } from '@/server/auth'

export default async function AdminDashboardPage() {
	const { ability } = await getServerAuthSession()
	if (ability.cannot('manage', 'all')) {
		notFound()
	}

	return (
		<main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-5 pt-10 lg:gap-10">
			<h1 className="fluid-3xl font-heading font-bold">Coming Soon</h1>
		</main>
	)
}
