import * as React from 'react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Contributor } from '@/components/contributor'
import { getAllWorkshops } from '@/lib/workshops/workshops.service'
import { getImpersonatedSession } from '@/server/auth'
import { log } from '@/server/logger'
import { cn } from '@/utils/cn'
import { FileText, Pencil } from 'lucide-react'

import {
	Alert,
	AlertDescription,
	Button,
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@coursebuilder/ui'

export const metadata: Metadata = {
	title: 'Admin Workshops | Epic Web',
}

export default async function AdminWorkshopsIndexPage() {
	// Authorization check - verify user has admin privileges
	const { ability, session } = await getImpersonatedSession()
	if (ability.cannot('manage', 'all')) {
		log.warn('Unauthorized access attempt to admin workshops page', {
			userId: session?.user?.id,
			userRole:
				session?.user?.roles?.map((r: any) => r.name).join(', ') ||
				session?.user?.role ||
				'user',
		})
		notFound()
	}

	let workshops: any[] = []
	let workshopsError = false

	// Handle workshops retrieval with error handling
	try {
		workshops = await getAllWorkshops()
	} catch (error) {
		log.error('Failed to retrieve workshops list in admin page', {
			error: error instanceof Error ? error.message : 'Unknown error',
			stack: error instanceof Error ? error.stack : undefined,
			userId: session?.user?.id,
		})
		workshopsError = true
	}

	return (
		<main className="container px-5">
			<div className="flex w-full items-center justify-between">
				<h1 className="text-3xl font-bold">All Workshops</h1>
			</div>

			{workshopsError ? (
				<Alert className="mt-6 border-red-200 bg-red-50">
					<AlertDescription className="text-red-800">
						Failed to load workshops. Please try refreshing the page or contact
						support if the problem persists.
					</AlertDescription>
				</Alert>
			) : workshops.length === 0 ? (
				<div className="text-muted-foreground mt-10 flex items-center justify-center py-8">
					<p>No workshops found. Create your first workshop to get started.</p>
				</div>
			) : (
				<Table className="mt-10">
					<TableHeader>
						<TableRow>
							<TableHead>Title</TableHead>
							<TableHead>Author</TableHead>
							<TableHead>Status</TableHead>
							<TableHead>Actions</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{workshops.map((workshop) => (
							<TableRow key={workshop.id}>
								<TableCell>
									<Link
										href={`/workshops/${workshop.fields.slug}/edit`}
										className="font-medium"
									>
										{workshop.fields.title}
									</Link>
								</TableCell>
								<TableCell>
									<Contributor />
								</TableCell>
								<TableCell>{workshop.fields.state}</TableCell>
								<TableCell>
									<Button
										asChild
										variant="outline"
										size="sm"
										className="flex items-center gap-1"
									>
										<Link href={`/workshops/${workshop.fields.slug}/edit`}>
											<Pencil className="w-3" />
											Edit
										</Link>
									</Button>
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			)}
		</main>
	)
}
