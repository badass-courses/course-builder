import * as React from 'react'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { getTutorial } from '@/lib/tutorials-query'
import { getServerAuthSession } from '@/server/auth'

export default async function ModulePage(props: {
	params: Promise<{ module: string }>
}) {
	const params = await props.params
	const { ability } = await getServerAuthSession()

	if (!ability.can('read', 'Content')) {
		redirect('/login')
	}

	const tutorial = await getTutorial(params.module)

	if (!tutorial) {
		notFound()
	}

	const lessons = tutorial.resources.filter(
		(resource) => resource.resource.type === 'lesson',
	)
	const sections = tutorial.resources.filter(
		(resource) => resource.resource.type === 'section',
	)

	return (
		<div className="hidden h-full flex-col md:flex">
			<div className="container flex flex-col items-start justify-between space-y-2 py-4 sm:flex-row sm:items-center sm:space-y-0 md:h-16">
				<h2 className="text-lg font-semibold">
					{tutorial.fields.title} (tutorial)
				</h2>
				<p>{tutorial.fields.description}</p>
				{ability.can('update', 'Content') && (
					<Link href={`/tutorials/${params.module}/edit`}>edit module</Link>
				)}
			</div>
			<div className="flex flex-col">
				{sections.map((resource) => {
					return (
						<div key={resource.resourceId}>
							<h3 className="font-bold">
								{resource.resource.fields.title} Section
							</h3>
							{resource.resource.resources.length > 0 && (
								<ul>
									{resource.resource.resources
										// if there is no section present this will also present videoResources
										.filter((resource) => resource.resource.type === 'lesson')
										.map((lesson) => {
											console.log(lesson.resource.type)
											return (
												<li key={lesson.resourceId}>
													<div>
														<Link
															href={`/tutorials/${params.module}/${lesson.resource.fields.slug}`}
														>
															{lesson.resource.fields.title}{' '}
															{lesson.resource.type}
														</Link>
														{ability.can('create', 'Content') ? (
															<>
																<Link
																	className="text-xs"
																	href={`/tutorials/${params.module}/${resource.resource.fields.slug}/edit`}
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
							)}
						</div>
					)
				})}
				{lessons.length > 0 && (
					<ul>
						{lessons.map((lesson) => {
							return (
								<li key={lesson.resourceId}>
									<div>
										<Link
											href={`/tutorials/${params.module}/${lesson.resource.fields.slug}`}
										>
											{lesson.resource.fields.title} {lesson.resource.type}
										</Link>
										{ability.can('create', 'Content') ? (
											<>
												<Link
													className="text-xs"
													href={`/tutorials/${params.module}/${lesson.resource.fields.slug}/edit`}
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
				)}
			</div>
		</div>
	)
}
