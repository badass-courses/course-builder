import * as React from 'react'
import Link from 'next/link'
import { db } from '@/db'
import { contentResource, contentResourceResource } from '@/db/schema'
import { getServerAuthSession } from '@/server/auth'
import { and, asc, desc, eq, inArray, sql } from 'drizzle-orm'

import { ContentResource } from '@coursebuilder/core/types'
import {
	Button,
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from '@coursebuilder/ui'

export default async function Tutorials() {
	const { ability } = await getServerAuthSession()

	const visibility: ('public' | 'private' | 'unlisted')[] = ability.can(
		'update',
		'Content',
	)
		? ['public', 'private', 'unlisted']
		: ['public']
	const states: ('draft' | 'published')[] = ability.can('update', 'Content')
		? ['draft', 'published']
		: ['published']

	const tutorials: ContentResource[] = await db.query.contentResource.findMany({
		where: and(
			eq(contentResource.type, 'tutorial'),
			inArray(
				sql`JSON_EXTRACT (${contentResource.fields}, "$.visibility")`,
				visibility,
			),
			inArray(sql`JSON_EXTRACT (${contentResource.fields}, "$.state")`, states),
		),
		with: {
			resources: {
				with: {
					resource: {
						with: {
							resources: {
								with: {
									resource: true,
								},
								orderBy: asc(contentResourceResource.position),
							},
						},
					},
				},
				orderBy: asc(contentResourceResource.position),
			},
		},
		orderBy: desc(contentResource.createdAt),
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
				<Link href={`/tutorials/${tutorial.fields?.slug}`} key={tutorial.id}>
					<Card>
						<CardHeader>
							<CardTitle>{tutorial.fields?.title}</CardTitle>
						</CardHeader>
						<CardContent>{tutorial.fields?.description}</CardContent>
					</Card>
				</Link>
			))}
		</div>
	)
}
