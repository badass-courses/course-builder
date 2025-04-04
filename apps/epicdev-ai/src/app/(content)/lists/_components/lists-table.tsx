'use client'

import React from 'react'
import Link from 'next/link'
import type { List } from '@/lib/lists'
import { deleteList } from '@/lib/lists-query'
import { Edit3, Trash } from 'lucide-react'

import {
	Alert,
	AlertTitle,
	Button,
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@coursebuilder/ui'

export function ListsTable({
	lists,
	canCreateContent,
}: {
	lists: List[]
	canCreateContent: boolean
}) {
	const [error, setError] = React.useState<string | null>(null)
	return (
		<>
			{error && <Alert variant={'destructive'}>{error}</Alert>}
			<Table className="min-w-[600px] overflow-x-scroll">
				<TableHeader>
					<TableRow>
						<TableHead>Title</TableHead>
						<TableHead>Description</TableHead>
						<TableHead>Type</TableHead>
						<TableHead>Resources</TableHead>
						{canCreateContent && <TableHead>Actions</TableHead>}
					</TableRow>
				</TableHeader>
				<TableBody>
					{lists.map((list) => (
						<TableRow key={list.id}>
							<TableCell>
								<Link
									href={`/${list.fields.slug}`}
									className="text-primary text-lg font-medium hover:underline"
								>
									{list.fields.title}
								</Link>
							</TableCell>
							<TableCell className="max-w-[90px] truncate">
								{list.fields.description}
							</TableCell>
							<TableCell>{list.fields.type}</TableCell>
							<TableCell>{list.resources?.length || 0}</TableCell>
							{canCreateContent && (
								<TableCell className="flex gap-2">
									<Button asChild title="Edit" size="icon" variant="outline">
										<Link href={`/lists/${list.fields.slug}/edit`}>
											<Edit3 className="h-3 w-3" />
										</Link>
									</Button>
									<Button
										title={
											list.resources.length > 0
												? 'Delete'
												: 'Must be empty to delete'
										}
										disabled={list.resources.length > 0}
										size="icon"
										variant="outline"
										onClick={async () => {
											await deleteList(list.id).catch((e) => {
												setError(e)
											})
										}}
									>
										<Trash className="h-3 w-3" />
									</Button>
								</TableCell>
							)}
						</TableRow>
					))}
					{lists.length === 0 && (
						<TableRow>
							<TableCell colSpan={3} className="py-4 text-center">
								No lists found
							</TableCell>
						</TableRow>
					)}
				</TableBody>
			</Table>
		</>
	)
}
