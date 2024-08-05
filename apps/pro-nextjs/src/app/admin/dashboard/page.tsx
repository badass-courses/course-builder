import React from 'react'
import { notFound } from 'next/navigation'
import { getServerAuthSession } from '@/server/auth'

export default async function AdminDashboardPage() {
	const { ability } = await getServerAuthSession()
	if (ability.cannot('manage', 'all')) {
		notFound()
	}

	return (
		<main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
			<div className="flex items-center">
				<h1 className="text-lg font-semibold md:text-2xl">Dashboard</h1>
			</div>
			<div className="flex flex-1 items-center justify-center rounded-lg border border-dashed shadow-sm">
				*coming soon*
			</div>
		</main>
	)
}
