import * as React from 'react'
import type { Metadata, ResolvingMetadata } from 'next'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { getTutorial } from '@/lib/tutorials-query'
import { getServerAuthSession } from '@/server/auth'
import { PencilIcon } from '@heroicons/react/24/outline'

import { ContentResourceResource } from '@coursebuilder/core/types'
import { Button, Separator } from '@coursebuilder/ui'

type Props = {
	params: { module: string }
	searchParams: { [key: string]: string | string[] | undefined }
}

export async function generateMetadata(
	{ params, searchParams }: Props,
	parent: ResolvingMetadata,
): Promise<Metadata> {
	const tutorial = await getTutorial(params.module)

	if (!tutorial) {
		return parent as Metadata
	}

	return {
		title: tutorial.fields.title,
	}
}

export default async function ModulePage({ params }: Props) {
	const { ability } = await getServerAuthSession()

	if (!ability.can('read', 'Content')) {
		redirect('/login')
	}

	const tutorial = await getTutorial(params.module)

	if (!tutorial) {
		notFound()
	}

	return (
		<div className="container relative border-x px-0">
			<div className="px-8">
				<h1 className="font-heading py-16 text-5xl font-bold sm:text-6xl lg:text-7xl">
					{tutorial.fields.title}
				</h1>
				<p>{tutorial.fields.description}</p>
				{ability.can('update', 'Content') && (
					<Button
						asChild
						variant="secondary"
						className="absolute right-5 top-5 gap-1"
					>
						<Link href={`/tutorials/${params.module}/edit`}>Edit</Link>
					</Button>
				)}
			</div>
			<div className="flex flex-col border-t md:flex-row">
				{/* {tutorial.fields.body && ( */}
				<article className="prose sm:prose-lg px-8 pt-8">
					<p>
						Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam ut
						sem arcu. Proin sed feugiat arcu. Integer nunc justo, auctor
						tincidunt euismod dignissim, varius sed lorem. Nam interdum lobortis
						egestas. Quisque vel sollicitudin tortor. Quisque ligula elit,
						volutpat in dignissim eu, elementum quis velit. Ut consequat tempus
						urna et tincidunt. Integer in tempus leo, quis semper eros. Mauris
						et eros quis erat scelerisque accumsan sed sit amet velit.
						Vestibulum scelerisque ligula nisl, nec porttitor risus feugiat
						sodales. Vestibulum ante ipsum primis in faucibus orci luctus et
						ultrices posuere cubilia curae;
					</p>
					<p>
						Vivamus finibus pulvinar posuere. Nunc dignissim consequat suscipit.
						Sed sed lectus ipsum. Mauris vulputate gravida augue eu dignissim.
						Interdum et malesuada fames ac ante ipsum primis in faucibus. Nulla
						vitae augue eu mauris mattis sagittis in nec turpis. Ut nunc eros,
						elementum non fermentum id, maximus ut libero. Praesent tristique
						odio nec felis porta, vel rutrum augue dictum. Aenean id erat
						elementum, sodales magna et, placerat eros. Aenean tristique risus
						quis sapien fringilla, vitae ultricies sapien ullamcorper. Etiam ut
						nulla maximus ante euismod pretium eu nec eros. Phasellus consequat
						varius lorem, eu laoreet sapien rutrum eget. Pellentesque feugiat
						dui placerat augue congue, ut porttitor leo vehicula. Curabitur id
						sapien cursus, tristique odio vitae, venenatis erat. Sed cursus
						mattis velit vitae consequat. Praesent sed ex ut quam tincidunt
						euismod.
					</p>
				</article>
				{/* )} */}
				<div className="flex w-full flex-col gap-3 border-l pb-16 pt-5">
					{tutorial.resources.map((resource) => {
						return (
							<div key={resource.resourceId}>
								{resource.resource.type === 'section' ? (
									<h3 className="px-5 py-2 text-lg font-bold">
										{resource.resource.fields.title}
									</h3>
								) : (
									<div className="flex w-full flex-row hover:bg-gray-900">
										<Link
											className="w-full"
											href={`/tutorials/${params.module}/${resource.resource.fields.slug}`}
										>
											{resource.resource.fields.title}
										</Link>
										{ability.can('create', 'Content') ? (
											<div className="w-full justify-end">
												<Button asChild size="sm">
													<Link
														className="text-xs"
														href={`/tutorials/${params.module}/${resource.resource.fields.slug}/edit`}
													>
														edit
													</Link>
												</Button>
											</div>
										) : null}
									</div>
								)}
								{resource.resource.resources.length > 0 && (
									<ul>
										{resource.resource.resources.map((lesson) => {
											return (
												<li
													key={lesson.resourceId}
													className="flex w-full items-center"
												>
													<Link
														className="hover:bg-secondary w-full px-5 py-2"
														href={`/tutorials/${params.module}/${lesson.resource.fields.slug}`}
													>
														{lesson.resource.fields.title}
													</Link>
													{ability.can('create', 'Content') ? (
														<Button
															asChild
															variant="outline"
															size="icon"
															className="scale-75"
														>
															<Link
																href={`/tutorials/${params.module}/${lesson.resource.fields.slug}/edit`}
															>
																<PencilIcon className="w-3" />
															</Link>
														</Button>
													) : null}
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
		</div>
	)
}
