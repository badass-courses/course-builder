import * as React from 'react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getAbility } from '@/ability'
import { getPrompts } from '@/lib/prompts-query'
import { getServerAuthSession } from '@/server/auth'

import {
	Button,
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from '@coursebuilder/ui'

export default async function PromptsIndexPage() {
	const session = await getServerAuthSession()
	const ability = getAbility({ user: session?.user })
	const user = session?.user

	if (!user || !ability.can('create', 'Content')) {
		notFound()
	}

	const prompts = await getPrompts()

	return (
		<div>
			{ability.can('update', 'Content') ? (
				<div className="bg-muted flex h-9 w-full items-center justify-between px-1">
					<div />
					<Button asChild className="h-7">
						<Link href={`/prompts/new`}>New Prompt</Link>
					</Button>
				</div>
			) : null}
			<div className="flex flex-col space-y-4 p-5 sm:p-10">
				<h2 className="text-lg font-bold">Prompts</h2>
				{prompts.map((prompt) => (
					<Card key={prompt._id}>
						<CardHeader>
							<CardTitle>
								<Link href={`/prompts/${prompt.slug || prompt._id}`}>
									{prompt.title}
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
