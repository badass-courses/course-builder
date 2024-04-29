import * as React from 'react'
import type { Metadata, ResolvingMetadata } from 'next'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { CldImage } from '@/app/_components/cld-image'
import { Contributor } from '@/app/_components/contributor'
import { getTutorial } from '@/lib/tutorials-query'
import { getServerAuthSession } from '@/server/auth'
import { PencilIcon } from '@heroicons/react/24/outline'
import ReactMarkdown from 'react-markdown'

import { Button } from '@coursebuilder/ui'

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

	const firstLesson = tutorial.resources[0]?.resource?.resources?.[0]?.resource

	return (
		<main className="container relative border-x px-0">
			{ability.can('update', 'Content') && (
				<Button
					asChild
					variant="secondary"
					className="absolute right-5 top-5 gap-1"
				>
					<Link href={`/tutorials/${params.module}/edit`}>Edit</Link>
				</Button>
			)}
			<div className="flex w-full flex-col-reverse items-center justify-between px-5 py-8 md:flex-row md:px-8 lg:px-16">
				<div className="mt-5 flex w-full flex-col items-center text-center md:mt-0 md:items-start md:text-left">
					<p className="text-primary mb-2 text-base">Free Tutorial</p>
					<h1 className="font-heading text-balance text-5xl font-bold text-white sm:text-6xl lg:text-7xl">
						{tutorial.fields.title}
					</h1>
					{tutorial.fields.description && (
						<h2 className="mt-5 text-balance text-xl">
							{tutorial.fields.description}
						</h2>
					)}
					<Contributor className="mt-5" />
					{firstLesson?.fields.slug && (
						<Button asChild size="lg" className="mt-10 w-full md:w-auto">
							<Link href={`${params.module}/${firstLesson?.fields.slug}`}>
								Start Watching
							</Link>
						</Button>
					)}
				</div>
				{tutorial.fields.coverImage?.url && (
					<CldImage
						width={400}
						height={400}
						src={tutorial.fields.coverImage.url}
						alt={tutorial.fields.coverImage?.alt || ''}
					/>
				)}
			</div>
			<div className="flex flex-col border-t md:flex-row">
				{tutorial.fields.body && (
					<article className="prose sm:prose-lg prose-invert prose-headings:text-balance w-full max-w-none px-5 py-8 md:px-8">
						<ReactMarkdown>{tutorial.fields.body}</ReactMarkdown>
					</article>
				)}
				<div className="flex w-full max-w-sm flex-col gap-3 border-l pb-16 pt-5">
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
		</main>
	)
}
