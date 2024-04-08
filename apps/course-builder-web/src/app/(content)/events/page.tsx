import * as React from 'react'
import Link from 'next/link'
import { db } from '@/db'
import { contentResource } from '@/db/schema'
import { getArticles } from '@/lib/articles-query'
import { getServerAuthSession } from '@/server/auth'
import { eq } from 'drizzle-orm'

import {
	Button,
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from '@coursebuilder/ui'

export default async function EventIndexPage() {
	const { ability } = await getServerAuthSession()
	const events = await db.query.contentResource.findMany({
		where: eq(contentResource.type, 'event'),
	})

	return (
		<div>
			{ability.can('update', 'Content') ? (
				<div className="bg-muted flex h-9 w-full items-center justify-between px-1">
					<div />
					<Button asChild className="h-7">
						<Link href={`/events/new`}>New Event</Link>
					</Button>
				</div>
			) : null}
			<div className="flex flex-col space-y-4 p-5 sm:p-10">
				<h2 className="text-lg font-bold">Events</h2>
				{events.map((event) => (
					<Card key={event.id}>
						<CardHeader>
							<CardTitle>
								<Link href={`/${event.fields?.slug || event.id}`}>
									{event.fields?.title}
								</Link>
							</CardTitle>
						</CardHeader>
						<CardContent></CardContent>
					</Card>
				))}
			</div>
		</div>
	)
}
