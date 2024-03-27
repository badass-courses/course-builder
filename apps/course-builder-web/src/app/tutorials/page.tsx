import * as React from 'react'
import Link from 'next/link'
import { db } from '@/db'
import { contentResource } from '@/db/schema'
import { getServerAuthSession } from '@/server/auth'
import { eq } from 'drizzle-orm'

import {
	Button,
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from '@coursebuilder/ui'

export default async function Tutorials() {
	const { ability } = await getServerAuthSession()

	const tutorials: any[] = await db.query.contentResource.findMany({
		where: eq(contentResource.type, 'tutorial'),
	})

	return (
		<div className="flex flex-col">
			{ability.can('update', 'Content') ? (
				<div className="bg-muted flex h-9 w-full items-center justify-between px-1">
					<div />
					<Button asChild className="h-7">
						<Link href={`/tutorials/new`}>New Tutorial</Link>
					</Button>
				</div>
			) : null}
			{tutorials.map((tutorial) => (
				<Link href={`/tutorials/${tutorial.fields.slug}`} key={tutorial.id}>
					<Card>
						<CardHeader>
							<CardTitle>{tutorial.fields.title}</CardTitle>
						</CardHeader>
						<CardContent>{tutorial.fields.description}</CardContent>
					</Card>
				</Link>
			))}
		</div>
	)
}
