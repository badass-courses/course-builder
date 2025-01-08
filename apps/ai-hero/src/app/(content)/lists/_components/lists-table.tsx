import Link from 'next/link'
import type { List } from '@/lib/lists'

import {
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
	return (
		<Table>
			<TableHeader>
				<TableRow>
					<TableHead>Title</TableHead>
					<TableHead>Description</TableHead>
					<TableHead>Posts</TableHead>
				</TableRow>
			</TableHeader>
			<TableBody>
				{lists.map((list) => (
					<TableRow key={list.id}>
						<TableCell>
							<Link
								href={
									canCreateContent
										? `/lists/${list.fields.slug}/edit`
										: `/lists/${list.fields.slug}`
								}
								className="text-primary hover:underline"
							>
								{list.fields.title}
							</Link>
						</TableCell>
						<TableCell>{list.fields.description}</TableCell>
						<TableCell>{list.resources?.length || 0} posts</TableCell>
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
	)
}
