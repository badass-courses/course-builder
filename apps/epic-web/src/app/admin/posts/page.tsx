import * as React from 'react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { Contributor } from '@/components/contributor'
import { getAllPosts } from '@/lib/posts-query'
import { cn } from '@/utils/cn'
import { FileText, Pencil } from 'lucide-react'

import {
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
	const posts = await getAllPosts()

	return (
		<main className="container px-5">
			<div className="flex w-full items-center justify-between">
				<h1 className="text-3xl font-bold">All Posts</h1>
			</div>
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
								<Contributor userId={post.createdById} />
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
		</main>
	)
}
