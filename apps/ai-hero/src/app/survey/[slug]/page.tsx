import type { Metadata, ResolvingMetadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Logo } from '@/components/brand/logo'
import LayoutClient from '@/components/layout-client'
import { env } from '@/env.mjs'
import {
	buildSurveyConfig,
	getSurvey,
	transformSurveyToQuizResource,
} from '@/lib/surveys-query'
import { getOGImageUrlForResource } from '@/utils/get-og-image-url-for-resource'
import { Plus } from 'lucide-react'

import { cn } from '@coursebuilder/ui/utils/cn'

import { SurveyPageClient } from '../_components/survey-page-client'

export async function generateMetadata(
	props: { params: Promise<{ slug: string }> } & ResolvingMetadata,
): Promise<Metadata> {
	const params = await props.params
	const survey = await getSurvey(params.slug)

	return {
		title: `Survey - ${survey?.fields?.title.replace('Survey: ', '')}`,
		openGraph: {
			images: [
				{
					url: `${env.NEXT_PUBLIC_URL}/api/og/default?title=${survey?.fields?.title}`,
				},
			],
		},
	}
}

export default async function SurveyBySlugPage({
	params,
}: {
	params: Promise<{ slug: string }>
}) {
	const { slug } = await params
	const survey = await getSurvey(slug)

	if (!survey) {
		notFound()
	}

	// Check if survey is published
	// if (survey.fields?.state !== 'published') {
	// 	notFound()
	// }

	const quizResource = await transformSurveyToQuizResource(survey)
	const surveyConfig = await buildSurveyConfig(survey.fields)

	return (
		<LayoutClient withContainer withNavigation={false} withFooter={false}>
			<div className="bg-size-[12px_12px] flex h-full min-h-[100svh] w-full grid-cols-6 grid-rows-[1fr_auto_1fr] bg-[radial-gradient(rgba(0,0,0,0.08)_1px,transparent_1px)] sm:grid sm:bg-none dark:bg-[radial-gradient(rgba(255,255,255,0.08)_1px,transparent_1px)] sm:dark:bg-none">
				<div className="hidden h-full w-full sm:flex" />
				<div className="border-border col-span-4 hidden h-full w-full items-start justify-center border-x p-10 sm:flex">
					<div>
						<Link href="/">
							<span
								className={cn(
									'leading-none! inline-flex flex-col items-center justify-center gap-2 text-xl font-semibold',
									{},
								)}
							>
								<Logo
									className="inline-flex opacity-80 transition-all ease-out hover:opacity-100"
									withAuthor={true}
								/>
							</span>
						</Link>
					</div>
				</div>
				<div className="hidden h-full w-full sm:flex" />
				<div className="border-border bg-size-[12px_12px] hidden h-full w-full border-y bg-transparent bg-[radial-gradient(rgba(0,0,0,0.08)_1px,transparent_1px)] sm:flex dark:bg-[radial-gradient(rgba(255,255,255,0.08)_1px,transparent_1px)]" />
				<div className="border-border bg-card relative col-span-4 mx-auto flex w-full shrink-0 justify-center p-5 pt-10 sm:items-center sm:border sm:p-10">
					<Plus
						className="absolute -left-2 -top-2 hidden size-4 opacity-50 sm:block"
						strokeWidth={1}
					/>
					<Plus
						className="absolute -right-2 -top-2 hidden size-4 opacity-50 sm:block"
						strokeWidth={1}
					/>
					<SurveyPageClient
						quizResource={quizResource}
						surveyConfig={surveyConfig}
						surveyId={survey.fields?.slug}
					/>
					<Plus
						className="absolute -bottom-2 -left-2 hidden size-4 opacity-50 sm:block"
						strokeWidth={1}
					/>
					<Plus
						className="absolute -bottom-2 -right-2 hidden size-4 opacity-50 sm:block"
						strokeWidth={1}
					/>
				</div>
				<div className="border-border bg-size-[12px_12px] hidden h-full w-full border-y bg-transparent bg-[radial-gradient(rgba(0,0,0,0.08)_1px,transparent_1px)] sm:flex dark:bg-[radial-gradient(rgba(255,255,255,0.06)_1px,transparent_1px)]" />
				<div className="hidden h-full w-full sm:flex" />
				<div className="border-border col-span-4 hidden h-full w-full border-x sm:flex" />
				<div className="hidden h-full w-full sm:flex" />
			</div>
		</LayoutClient>
	)
}
