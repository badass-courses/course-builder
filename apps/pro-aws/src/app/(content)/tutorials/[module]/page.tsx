import * as React from 'react'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { getTutorial } from '@/lib/tutorials-query'
import { getServerAuthSession } from '@/server/auth'

import { ContentResourceResource } from '@coursebuilder/core/types'
import { Separator } from '@coursebuilder/ui'

export default async function ModulePage({
	params,
}: {
	params: { module: string }
}) {
	const { ability } = await getServerAuthSession()

	if (!ability.can('read', 'Content')) {
		redirect('/login')
	}

	const tutorial = await getTutorial(params.module)

	if (!tutorial) {
		notFound()
	}

	return (
		<div className="hidden h-full flex-col md:flex">
			<div className="container flex flex-col items-start justify-between space-y-2 py-4 sm:flex-row sm:items-center sm:space-y-0 md:h-16">
				<h2 className="text-lg font-semibold">{tutorial.fields.title}</h2>
				<p>{tutorial.fields.description}</p>
				{ability.can('update', 'Content') && (
					<Link href={`/tutorials/${params.module}/edit`}>edit module</Link>
				)}
			</div>
			<div className="flex flex-col">
				{tutorial.resources.map((resource) => {
					return (
						<div key={resource.resourceId}>
							{resource.resource.type === 'section' ? (
								<h3>{resource.resource.fields.title}</h3>
							) : (
								<h3>{resource.resource.fields.title}</h3>
							)}
							{resource.resource.resources.length > 0 && (
								<ul>
									{resource.resource.resources.map((lesson) => {
										return (
											<li key={lesson.resourceId}>
												<Link
													href={`/tutorials/${params.module}/${lesson.resource.fields.slug}`}
												>
													{lesson.resource.fields.title}
												</Link>
											</li>
										)
									})}
								</ul>
							)}
						</div>
					)
				})}
			</div>
		</div>
	)
}
