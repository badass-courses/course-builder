import * as React from 'react'
import type { Metadata, ResolvingMetadata } from 'next'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { CldImage } from '@/app/_components/cld-image'
import { Contributor } from '@/app/_components/contributor'
import config from '@/config'
import { env } from '@/env.mjs'
import { getModuleProgressForUser } from '@/lib/progress'
import type { Tutorial } from '@/lib/tutorial'
import { getTutorial } from '@/lib/tutorials-query'
import type { Workshop } from '@/lib/workshop'
import { getWorkshop } from '@/lib/workshops-query'
import { getServerAuthSession } from '@/server/auth'
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
	const workshop = await getWorkshop(params.module)

	if (!workshop) {
		return parent as Metadata
	}

	return {
		title: workshop.fields.title,
		description: workshop.fields.description,
	}
}

export default async function ModulePage({ params }: Props) {
	const { ability } = await getServerAuthSession()

	if (!ability.can('read', 'Content')) {
		redirect('/login')
	}

	const workshop = await getWorkshop(params.module)

	if (!workshop) {
		notFound()
	}

	const moduleProgress = await getModuleProgressForUser(workshop.id)

	const firstLesson = workshop.resources[0]?.resource?.resources?.[0]?.resource

	return (
		<main className="container relative px-0">
			<WorkshopMetadata workshop={workshop} />
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
						{workshop.fields.title}
					</h1>
					{workshop.fields.description && (
						<h2 className="fluid-lg text-muted-foreground mt-5">
							{workshop.fields.description}
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
										Start Watching
									</Link>
								</Button>
							)}
						</>
					)}
				</div>
				{workshop.fields.coverImage?.url && (
					<CldImage
						width={400}
						height={400}
						src={workshop.fields.coverImage.url}
						alt={workshop.fields.coverImage?.alt || ''}
					/>
				)}
			</div>
			<div className="flex flex-col-reverse px-5 pb-10 md:flex-row md:gap-10">
				{workshop.fields.body && (
					<article className="prose sm:prose-lg w-full max-w-none py-8">
						<ReactMarkdown>{workshop.fields.body}</ReactMarkdown>
					</article>
				)}
				<div className="flex w-full flex-col gap-3 sm:max-w-sm">
					<strong className="font-mono text-sm font-bold uppercase tracking-wide text-gray-700">
						Contents
					</strong>
					<TutorialLessonList
						className="w-full max-w-none border-r-0"
						tutorial={workshop as unknown as ContentResource}
						moduleProgress={moduleProgress}
						maxHeight="h-auto"
						withHeader={false}
						wrapperClassName="border-x border-b bg-card overflow-hidden rounded pb-0"
						widthFadeOut={false}
					/>
				</div>
			</div>
		</main>
	)
}

const WorkshopMetadata: React.FC<{ workshop: Workshop }> = ({ workshop }) => {
	const jsonLd: Course = {
		'@type': 'Course',
		name: workshop?.fields.title,
		author: config.author,
		creator: {
			'@type': 'Person',
			name: config.author,
		},
		description: workshop?.fields?.description as string,
		thumbnailUrl: workshop?.fields?.coverImage?.url as string,
		url: `${env.NEXT_PUBLIC_URL}/workshops/${workshop?.fields.slug}`,
	}

	return (
		<script
			type="application/ld+json"
			dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
		/>
	)
}
