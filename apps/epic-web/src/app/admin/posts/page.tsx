import * as React from 'react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Contributor } from '@/components/contributor'
import { getAllPosts } from '@/lib/posts-query'
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
	title: 'Admin Posts | Epic Web',
}

export default async function AdminPostsIndexPage() {
	// Authorization check - verify user has admin privileges
	const { ability, session } = await getImpersonatedSession()
	if (ability.cannot('manage', 'all')) {
		log.warn('Unauthorized access attempt to admin posts page', {
			userId: session?.user?.id,
			userRole: session?.user?.role,
		})
		notFound()
	}

	let posts: any[] = []
	let postsError = false

	// Handle posts retrieval with error handling
	try {
		posts = await getAllPosts()
	} catch (error) {
		log.error('Failed to retrieve posts list in admin page', {
			error: error instanceof Error ? error.message : 'Unknown error',
			stack: error instanceof Error ? error.stack : undefined,
			userId: session?.user?.id,
		})
		postsError = true
	}

	return (
		<main className="container px-5">
			<div className="flex w-full items-center justify-between">
				<h1 className="text-3xl font-bold">All Posts</h1>
			</div>

			{postsError ? (
				<Alert className="mt-6 border-red-200 bg-red-50">
					<AlertDescription className="text-red-800">
						Failed to load posts. Please try refreshing the page or contact
						support if the problem persists.
					</AlertDescription>
				</Alert>
			) : posts.length === 0 ? (
				<div className="text-muted-foreground mt-10 flex items-center justify-center py-8">
					<p>No posts found. Create your first post to get started.</p>
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
						{posts.map((post) => (
							<TableRow key={post.id}>
								<TableCell>
									<Link href={`/${post.fields.slug}`} className="font-medium">
										{post.fields.title}
									</Link>
								</TableCell>
								<TableCell>
									<Contributor />
								</TableCell>
								<TableCell>{post.fields.state}</TableCell>
								<TableCell>
									<Button
										asChild
										variant="outline"
										size="sm"
										className="flex items-center gap-1"
									>
										<Link href={`/posts/${post.fields.slug}/edit`}>
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
