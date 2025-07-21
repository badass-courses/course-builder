import * as React from 'react'
import Link from 'next/link'
import { Layout } from '@/components/app/layout'
import { getCachedWorkshops } from '@/lib/workshops-query'
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

	const workshops = await getCachedWorkshops()

	return (
		<Layout>
			<div className="container mx-auto py-8">
				<div className="mb-8">
					<h1 className="text-3xl font-bold">Workshops</h1>
					<p className="text-muted-foreground mt-2">
						Manage your educational workshops and courses.
					</p>
				</div>

				{workshops.length === 0 ? (
					<div className="py-16 text-center">
						<h2 className="mb-4 text-xl font-semibold">No Workshops Yet</h2>
						<p className="text-muted-foreground">
							Create your first course-type post to get started with workshops.
						</p>
					</div>
				) : (
					<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
						{workshops.map((workshop) => (
							<Link
								key={workshop.id}
								href={`/workshops/${workshop.fields?.slug}`}
								className="hover:bg-muted rounded-lg border p-6 transition-colors"
							>
								<h3 className="text-lg font-semibold">
									{workshop.fields?.title}
								</h3>
								{workshop.fields?.description && (
									<p className="text-muted-foreground mt-2 text-sm">
										{workshop.fields.description}
									</p>
								)}
								<div className="text-muted-foreground mt-4 text-xs">
									{workshop.fields?.state === 'published'
										? 'Published'
										: 'Draft'}
								</div>
							</Link>
						))}
					</div>
				)}
			</div>
		</Layout>
	)
}
