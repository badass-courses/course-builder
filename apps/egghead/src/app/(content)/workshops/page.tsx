import * as React from 'react'
import { Layout } from '@/components/app/layout'
import { getServerAuthSession } from '@/server/auth'

export const dynamic = 'force-dynamic'

export default async function WorkshopsPage() {
	const { ability } = await getServerAuthSession()

	if (!ability.can('create', 'Content')) {
		return (
			<Layout>
				<div className="flex min-h-screen items-center justify-center">
					<div className="text-center">
						<h1 className="text-2xl font-bold">Access Denied</h1>
						<p className="text-muted-foreground mt-2">
							You don't have permission to view workshops.
						</p>
					</div>
				</div>
			</Layout>
		)
	}

	return (
		<Layout>
			<div className="container mx-auto py-8">
				<div className="mb-8">
					<h1 className="text-3xl font-bold">Workshops</h1>
					<p className="text-muted-foreground mt-2">
						Manage your educational workshops and courses.
					</p>
				</div>

				<div className="py-16 text-center">
					<h2 className="mb-4 text-xl font-semibold">Coming Soon</h2>
					<p className="text-muted-foreground">
						Workshop listing and management interface will be implemented here.
					</p>
				</div>
			</div>
		</Layout>
	)
}
