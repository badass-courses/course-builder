import * as React from 'react'
import { Metadata } from 'next'
import Link from 'next/link'
import { env } from '@/env.mjs'
import { getAllTutorials } from '@/lib/tutorials-query'
import { getServerAuthSession } from '@/server/auth'

import {
	Button,
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from '@coursebuilder/ui'

export const metadata: Metadata = {
	title: `Value-Based Design Tutorials by Nick Disabato`,
}

export default async function Tutorials() {
	const { ability } = await getServerAuthSession()
	const tutorials = await getAllTutorials()

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
