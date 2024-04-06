import * as React from 'react'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { getTutorial } from '@/lib/tutorials-query'
import { getServerAuthSession } from '@/server/auth'

import { Button } from '@coursebuilder/ui'

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
				{tutorial.resources.map((tutorialResource) => {
					return (
						<div key={tutorialResource.resourceId}>
							{tutorialResource.resource.type === 'section' ? (
								<h3>{tutorialResource.resource.fields.title}</h3>
							) : (
								<div>
									<Link
										href={`/tutorials/${params.module}/${tutorialResource.resource.fields.slug}`}
									>
										{tutorialResource.resource.fields.title}
									</Link>
									{ability.can('create', 'Content') ? (
										<>
											<Link
												className="text-xs"
												href={`/tutorials/${params.module}/${tutorialResource.resource.fields.slug}/edit`}
											>
												edit
											</Link>
										</>
									) : null}
								</div>
							)}
							{tutorialResource.resource.resources.length > 0 ? (
								<ul>
									{tutorialResource.resource.resources.map((lesson) => {
										return (
											<li key={lesson.resourceId}>
												<div>
													<Link
														href={`/tutorials/${params.module}/${lesson.resource.fields.slug}`}
													>
														{lesson.resource.fields.title}
													</Link>
													{ability.can('create', 'Content') ? (
														<>
															<Link
																className="text-xs"
																href={`/tutorials/${params.module}/${tutorialResource.resource.fields.slug}/edit`}
															>
																edit
															</Link>
														</>
													) : null}
												</div>
											</li>
										)
									})}
								</ul>
							) : null}
						</div>
					)
				})}
			</div>
		</div>
	)
}
