import * as React from 'react'
import { Suspense } from 'react'
import { headers } from 'next/headers'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { db } from '@/db'
import { contentResource, contentResourceResource } from '@/db/schema'
import { getServerAuthSession } from '@/server/auth'
import { asc, like } from 'drizzle-orm'
import { last } from 'lodash'
import ReactMarkdown from 'react-markdown'

import { ContentResource } from '@coursebuilder/core/types'
import { Button } from '@coursebuilder/ui'

type Props = {
	params: { lesson: string; module: string }
	searchParams: { [key: string]: string | string[] | undefined }
}

export default async function LessonPage({ params }: Props) {
	const tutorialLoader = db.query.contentResource.findFirst({
		where: like(contentResource.id, `%${last(params.module.split('-'))}%`),
		with: {
			resources: {
				with: {
					resource: {
						with: {
							resources: {
								with: {
									resource: true,
								},
								orderBy: asc(contentResourceResource.position),
							},
						},
					},
				},
				orderBy: asc(contentResourceResource.position),
			},
		},
	})
	const lessonLoader = db.query.contentResource.findFirst({
		where: like(contentResource.id, `%${last(params.lesson.split('-'))}%`),
		with: {
			resources: {
				with: {
					resource: {
						with: {
							resources: {
								with: {
									resource: true,
								},
								orderBy: asc(contentResourceResource.position),
							},
						},
					},
				},
				orderBy: asc(contentResourceResource.position),
			},
		},
	})
	return (
		<div>
			<main className="mx-auto w-full" id="tip">
				<Suspense
					fallback={
						<div className="bg-muted flex h-9 w-full items-center justify-between px-1" />
					}
				>
					<LessonActionBar lessonLoader={lessonLoader} />
				</Suspense>

				<article className="relative z-10 border-l border-transparent px-5 pb-16 pt-8 sm:pt-10 xl:border-gray-800 xl:pt-10">
					<div className="mx-auto w-full max-w-screen-lg pb-5 lg:px-5">
						<div className="flex w-full grid-cols-11 flex-col gap-0 sm:gap-10 lg:grid">
							<div className="flex flex-col lg:col-span-8">
								<LessonBody lessonLoader={lessonLoader} />
							</div>
						</div>
					</div>
				</article>
			</main>
		</div>
	)
}

async function LessonActionBar({
	lessonLoader,
}: {
	lessonLoader: Promise<ContentResource | null | undefined>
}) {
	const { ability } = await getServerAuthSession()
	const lesson = await lessonLoader

	return (
		<>
			{lesson && ability.can('update', 'Content') ? (
				<div className="bg-muted flex h-9 w-full items-center justify-between px-1">
					<div />
					<Button size="sm" asChild>
						<Link href={`/tips/${lesson.fields?.slug || lesson.id}/edit`}>
							Edit
						</Link>
					</Button>
				</div>
			) : (
				<div className="bg-muted flex h-9 w-full items-center justify-between px-1" />
			)}
		</>
	)
}

async function LessonBody({
	lessonLoader,
}: {
	lessonLoader: Promise<ContentResource | null | undefined>
}) {
	const lesson = await lessonLoader

	if (!lesson) {
		notFound()
	}

	return (
		<>
			<h1 className="font-heading relative inline-flex w-full max-w-2xl items-baseline pb-5 text-2xl font-black sm:text-3xl lg:text-4xl">
				{lesson.fields?.title}
			</h1>

			{lesson.fields?.body && (
				<>
					<ReactMarkdown className="prose dark:prose-invert">
						{lesson.fields?.body}
					</ReactMarkdown>
				</>
			)}
		</>
	)
}
