import * as React from 'react'
import type { Metadata, ResolvingMetadata } from 'next'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { CldImage } from '@/app/_components/cld-image'
import { Contributor } from '@/app/_components/contributor'
import config from '@/config'
import { env } from '@/env.mjs'
import type { Module } from '@/lib/module'
import { getModuleProgressForUser } from '@/lib/progress'
import { getNextResource } from '@/lib/resources/get-next-resource'
import { getTutorial } from '@/lib/tutorials-query'
import { getServerAuthSession } from '@/server/auth'
import { getOGImageUrlForResource } from '@/utils/get-og-image-url-for-resource'
import ReactMarkdown from 'react-markdown'
import { Course } from 'schema-dts'

import type { ContentResource } from '@coursebuilder/core/types'
import { Button } from '@coursebuilder/ui'

import { TutorialLessonList } from '../_components/tutorial-lesson-list'

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
		description: tutorial.fields.description,
		openGraph: {
			images: [
				getOGImageUrlForResource(
					tutorial as unknown as ContentResource & {
						fields?: { slug: string }
					},
				),
			],
		},
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

	const moduleProgress = await getModuleProgressForUser(params.module)

	return (
		<main className="container relative px-0">
			<TutorialMetadata tutorial={tutorial} />
			{ability.can('update', 'Content') && (
				<Button
					asChild
					variant="secondary"
					className="absolute right-5 top-5 gap-1"
				>
					<Link href={`/tutorials/${params.module}/edit`}>Edit</Link>
				</Button>
			)}
			<div className="flex w-full flex-col-reverse items-center justify-between px-5 py-8 md:flex-row">
				<div className="mt-5 flex w-full flex-col items-center text-center md:mt-0 md:items-start md:text-left">
					<p className="text-primary mb-2 text-base">Free Tutorial</p>
					<h1 className="font-heading fluid-4xl font-bold">
						{tutorial.fields.title}
					</h1>
					{tutorial.fields.description && (
						<h2 className="fluid-lg text-muted-foreground mt-5">
							{tutorial.fields.description}
						</h2>
					)}
					<Contributor className="mt-5" />
					{moduleProgress?.nextResource?.fields?.slug ? (
						<Button asChild size="lg" className="mt-10 w-full md:w-auto">
							<Link
								href={`${params.module}/${moduleProgress?.nextResource?.fields.slug}`}
							>
								Continue Watching
							</Link>
						</Button>
					) : (
						<>
							{firstLesson?.fields.slug && (
								<Button asChild size="lg" className="mt-10 w-full md:w-auto">
									<Link href={`${params.module}/${firstLesson?.fields.slug}`}>
										Start Learning
									</Link>
								</Button>
							)}
						</>
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
			<div className="flex flex-col-reverse px-5 pb-10 md:flex-row md:gap-10">
				{tutorial.fields.body && (
					<article className="prose sm:prose-lg w-full max-w-none py-8">
						<ReactMarkdown>{tutorial.fields.body}</ReactMarkdown>
					</article>
				)}
				<div className="flex w-full flex-col gap-3 sm:max-w-sm">
					<strong className="font-mono text-sm font-bold uppercase tracking-wide">
						Contents
					</strong>
					<TutorialLessonList
						className="w-full max-w-none border-r-0"
						tutorial={tutorial}
						maxHeight="h-auto"
						withHeader={false}
						wrapperClassName="border bg-card overflow-hidden rounded pb-0"
					/>
				</div>
			</div>
		</main>
	)
}

const TutorialMetadata: React.FC<{ tutorial: Module }> = ({ tutorial }) => {
	const jsonLd: Course = {
		'@type': 'Course',
		name: tutorial?.fields.title,
		author: config.author,
		creator: {
			'@type': 'Person',
			name: config.author,
		},
		description: tutorial?.fields?.description as string,
		thumbnailUrl: tutorial?.fields?.coverImage?.url as string,
		url: `${env.NEXT_PUBLIC_URL}/tutorials/${tutorial?.fields.slug}`,
	}

	return (
		<script
			type="application/ld+json"
			dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
		/>
	)
}
