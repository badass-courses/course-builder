import * as React from 'react'
import Link from 'next/link'
import { getAbility } from '@/ability'
import { getServerAuthSession } from '@/server/auth'

import {
	Button,
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from '@coursebuilder/ui'

export default async function Tutorials() {
	const session = await getServerAuthSession()
	const ability = getAbility({ user: session?.user })
	const tutorials: any[] = []

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
				<Link href={`/tutorials/${tutorial.slug}`} key={tutorial.id}>
					<Card>
						<CardHeader>
							<CardTitle>{tutorial.title}</CardTitle>
						</CardHeader>
						<CardContent>{tutorial.description}</CardContent>
					</Card>
				</Link>
			))}
		</div>
	)
}
